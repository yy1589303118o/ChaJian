/*
 * Spotify_remove_ads_local.js
 *
 * Shadowrocket 2.2.90+
 *
 * Spotify 响应净化
 *
 * 设计原则：
 * 1. 只处理明确指定的 Spotify 首页接口
 * 2. 不处理播放接口
 * 3. 不处理音频 CDN
 * 4. 不处理 DRM
 * 5. 不处理 play-queue
 * 6. JSON 无法解析时原样返回
 * 7. 结构无法判断时原样返回
 * 8. 尽量减少误伤
 */

(function () {

    // =====================================================
    // 基础工具
    // =====================================================

    function getURL() {
        try {
            return typeof $request !== "undefined" && $request
                ? ($request.url || "")
                : "";
        } catch (e) {
            return "";
        }
    }

    function getBody() {
        try {
            if (typeof $response === "undefined" || !$response) {
                return null;
            }

            return $response.body;
        } catch (e) {
            return null;
        }
    }

    function done(body) {
        try {
            $done({
                body: body
            });
        } catch (e) {
            $done({});
        }
    }


    // =====================================================
    // 当前 URL
    // =====================================================

    var url = getURL();
    var body = getBody();

    if (!body) {
        done();
        return;
    }


    // =====================================================
    // 绝对安全区
    //
    // 如果以后 Spotify 的接口发生串线，
    // 遇到这些关键词直接放行。
    // =====================================================

    var lowerURL = url.toLowerCase();

    var protectedURL = [
        "/playback",
        "/play-queue",
        "/queue",
        "/audio",
        "/stream",
        "/drm",
        "/license",
        "/key",
        "/metadata",
        "/track",
        "/episode",
        "/player",
        "/connect"
    ];

    for (var p = 0; p < protectedURL.length; p++) {
        if (lowerURL.indexOf(protectedURL[p]) !== -1) {
            done(body);
            return;
        }
    }


    // =====================================================
    // 只允许指定接口
    // =====================================================

    var allowedPath = [
        "/bootstrap",
        "/user-customization-service",
        "/home-feed-view",
        "/user-attribute"
    ];

    var matched = false;

    for (var a = 0; a < allowedPath.length; a++) {
        if (lowerURL.indexOf(allowedPath[a]) !== -1) {
            matched = true;
            break;
        }
    }

    if (!matched) {
        done(body);
        return;
    }


    // =====================================================
    // JSON 解析
    //
    // 失败直接原样返回
    // =====================================================

    var data;

    try {
        data = JSON.parse(body);
    } catch (e) {
        done(body);
        return;
    }

    if (!data || typeof data !== "object") {
        done(body);
        return;
    }


    // =====================================================
    // 判断一个对象是否明显属于广告
    //
    // 非常保守。
    // 不因为一个字段出现 "ad" 就直接删除。
    // =====================================================

    function isAdvertisementObject(obj) {

        if (!obj || typeof obj !== "object") {
            return false;
        }

        var type = "";
        var subtype = "";
        var uri = "";
        var title = "";
        var name = "";

        try {
            type = String(
                obj.type ||
                obj.item_type ||
                obj.card_type ||
                obj.content_type ||
                ""
            ).toLowerCase();

            subtype = String(
                obj.subtype ||
                obj.item_subtype ||
                ""
            ).toLowerCase();

            uri = String(
                obj.uri ||
                obj.target_uri ||
                obj.click_uri ||
                obj.link ||
                ""
            ).toLowerCase();

            title = String(
                obj.title ||
                obj.headline ||
                obj.label ||
                ""
            ).toLowerCase();

            name = String(
                obj.name ||
                ""
            ).toLowerCase();

        } catch (e) {
            return false;
        }


        // 明确的广告类型
        var adTypes = [
            "ad",
            "ads",
            "advertisement",
            "sponsored",
            "sponsored_ad",
            "native_ad",
            "audio_ad",
            "video_ad",
            "display_ad"
        ];

        for (var i = 0; i < adTypes.length; i++) {

            if (
                type === adTypes[i] ||
                subtype === adTypes[i]
            ) {
                return true;
            }
        }


        // 明确广告 URI
        if (
            uri.indexOf("spotify:ad") === 0 ||
            uri.indexOf("/ads/") !== -1 ||
            uri.indexOf("/ad/") !== -1 ||
            uri.indexOf("adclick") !== -1
        ) {
            return true;
        }


        // sponsored + 明确广告语义
        if (
            type.indexOf("sponsor") !== -1 ||
            subtype.indexOf("sponsor") !== -1
        ) {
            return true;
        }


        // 只有当 title/name 明确包含广告词时才认为是广告
        var adWords = [
            "advertisement",
            "sponsored",
            "广告"
        ];

        for (var j = 0; j < adWords.length; j++) {

            if (
                title.indexOf(adWords[j]) !== -1 ||
                name.indexOf(adWords[j]) !== -1
            ) {
                return true;
            }
        }

        return false;
    }


    // =====================================================
    // 递归净化
    //
    // 只删除“明确广告对象”
    // =====================================================

    function clean(value, depth) {

        if (depth > 25) {
            return value;
        }

        if (!value || typeof value !== "object") {
            return value;
        }


        // 数组
        if (Array.isArray(value)) {

            var result = [];

            for (var i = 0; i < value.length; i++) {

                var item = value[i];

                if (
                    item &&
                    typeof item === "object" &&
                    isAdvertisementObject(item)
                ) {
                    continue;
                }

                result.push(
                    clean(item, depth + 1)
                );
            }

            return result;
        }


        // 对象
        var output = {};

        for (var key in value) {

            if (!Object.prototype.hasOwnProperty.call(value, key)) {
                continue;
            }

            var val = value[key];

            var keyLower = String(key).toLowerCase();


            // =================================================
            // 明确广告列表
            //
            // 只对这些字段进行数组过滤
            // =================================================

            if (
                Array.isArray(val) &&
                (
                    keyLower === "ads" ||
                    keyLower === "advertisements" ||
                    keyLower === "sponsored_ads" ||
                    keyLower === "ad_units" ||
                    keyLower === "adunit" ||
                    keyLower === "advertising"
                )
            ) {
                var filtered = [];

                for (var x = 0; x < val.length; x++) {

                    if (
                        val[x] &&
                        typeof val[x] === "object" &&
                        isAdvertisementObject(val[x])
                    ) {
                        continue;
                    }

                    filtered.push(
                        clean(val[x], depth + 1)
                    );
                }

                output[key] = filtered;
                continue;
            }


            // =================================================
            // 明确广告对象
            // =================================================

            if (
                val &&
                typeof val === "object" &&
                isAdvertisementObject(val)
            ) {
                continue;
            }


            // =================================================
            // 其他内容正常递归
            // =================================================

            output[key] = clean(
                val,
                depth + 1
            );
        }

        return output;
    }


    // =====================================================
    // 执行净化
    // =====================================================

    var cleaned;

    try {
        cleaned = clean(data, 0);
    } catch (e) {

        // 任何异常：
        // 原样返回，绝对不破坏 Spotify
        done(body);
        return;
    }


    // =====================================================
    // 序列化
    // =====================================================

    var output;

    try {
        output = JSON.stringify(cleaned);
    } catch (e) {
        done(body);
        return;
    }


    // =====================================================
    // 最终安全检查
    //
    // 如果处理后异常变小太多，说明可能误删，
    // 放弃修改，返回原始数据。
    // =====================================================

    try {

        if (
            body.length > 50000 &&
            output.length < body.length * 0.25
        ) {
            done(body);
            return;
        }

    } catch (e) {
        done(body);
        return;
    }


    // =====================================================
    // 返回
    // =====================================================

    done(output);

})();