/*
 * 🍅 番茄小说 iOS 去广告
 * fanqie.js
 *
 * Loon / Shadowrocket / Surge
 * 无 BoxJs
 *
 * 思路：
 * 1. 只处理 JSON 响应
 * 2. 删除明确的广告对象
 * 3. 删除广告列表
 * 4. 清理广告标志
 * 5. 清理广告 URL
 * 6. 不碰正文文本
 * 7. 不碰日志/统计请求
 */

const body = $response.body;

if (!body) {
    $done({});
    return;
}

try {

    let obj = JSON.parse(body);

    // =========================================================
    // 广告字段
    // =========================================================

    const AD_KEYS = new Set([
        "ad_info",
        "adInfo",
        "ad_data",
        "adData",

        "ad_config",
        "adConfig",

        "ad_placement",
        "adPlacement",

        "ad_position",
        "adPosition",

        "ad_cell",
        "adCell",

        "ad_list",
        "adList",

        "ad_items",
        "adItems",

        "advertisement",
        "advertisements",

        "banner_ad",
        "bannerAd",

        "native_ad",
        "nativeAd",

        "feed_ad",
        "feedAd",

        "middle_ad",
        "middleAd",

        "bottom_ad",
        "bottomAd",

        "end_ad",
        "endAd",

        "video_ad",
        "videoAd",

        "reader_ad",
        "readerAd",

        "chapter_ad",
        "chapterAd",

        "page_ad",
        "pageAd",

        "next_ad",
        "nextAd",

        "pop_ad",
        "popAd",

        "splash_ad",
        "splashAd",

        "interstitial_ad",
        "interstitialAd",

        "reward_ad",
        "rewardAd",

        "rewarded_ad",
        "rewardedAd",

        "bidding_ad",
        "biddingAd",

        "bidding_ad_list",
        "biddingAdList",

        "after_video_ad",
        "afterVideoAd",

        "post_reward_ad",
        "postRewardAd"
    ]);


    // =========================================================
    // 广告标志
    // =========================================================

    const FLAG_KEYS = [
        "is_ad",
        "isAd",

        "has_ad",
        "hasAd",

        "ad_exist",
        "adExist",

        "show_ad",
        "showAd",

        "is_advertisement",
        "isAdvertisement"
    ];


    // =========================================================
    // 广告类型
    // =========================================================

    const AD_TYPES = new Set([
        "ad",
        "ads",
        "advert",
        "advertisement",
        "native_ad",
        "banner_ad",
        "feed_ad",
        "interstitial_ad",
        "reward_ad",
        "rewarded_ad",
        "video_ad"
    ]);


    // =========================================================
    // 判断是否为广告对象
    // =========================================================

    function isAdObject(obj) {

        if (!obj || typeof obj !== "object") {
            return false;
        }

        // 明确广告 ID
        if (
            obj.ad_id !== undefined ||
            obj.adId !== undefined
        ) {
            return true;
        }

        // 明确广告对象
        if (
            obj.ad_info ||
            obj.adInfo ||
            obj.ad_data ||
            obj.adData
        ) {
            return true;
        }

        // 广告 flag
        if (
            obj.is_ad === true ||
            obj.isAd === true ||
            obj.is_advertisement === true ||
            obj.isAdvertisement === true
        ) {
            return true;
        }

        // 类型
        const type = String(
            obj.type ??
            obj.cell_type ??
            obj.item_type ??
            obj.data_type ??
            obj.cellType ??
            ""
        ).toLowerCase();

        if (AD_TYPES.has(type)) {
            return true;
        }

        return false;
    }


    // =========================================================
    // 判断字符串是不是广告 URL
    // =========================================================

    function isAdUrl(value) {

        if (typeof value !== "string") {
            return false;
        }

        const s = value.toLowerCase();

        return (
            s.includes("ad-sign") ||
            s.includes("ads.toutiao") ||
            s.includes("ad.toutiao") ||
            s.includes("ad.doubleclick") ||
            s.includes("googleadservices") ||
            s.includes("snssdk") ||
            s.includes("pstatp") ||
            s.includes("pangolin") ||
            s.includes("adserver")
        );
    }


    // =========================================================
    // 清除广告 flag
    // =========================================================

    function cleanFlags(obj) {

        for (const key of FLAG_KEYS) {

            if (
                Object.prototype.hasOwnProperty.call(
                    obj,
                    key
                )
            ) {

                // 保持字段类型
                if (
                    key === "is_ad" ||
                    key === "isAd" ||
                    key === "has_ad" ||
                    key === "hasAd" ||
                    key === "ad_exist" ||
                    key === "adExist" ||
                    key === "show_ad" ||
                    key === "showAd" ||
                    key === "is_advertisement" ||
                    key === "isAdvertisement"
                ) {
                    obj[key] = false;
                }
            }
        }

        if (
            Object.prototype.hasOwnProperty.call(
                obj,
                "has_more_ineffective_ad"
            )
        ) {
            obj.has_more_ineffective_ad = 0;
        }
    }


    // =========================================================
    // 清理数组
    // =========================================================

    function cleanArray(arr, depth) {

        if (!Array.isArray(arr)) {
            return arr;
        }

        const result = [];

        for (const item of arr) {

            // 广告对象直接删除
            if (isAdObject(item)) {
                continue;
            }

            // 普通对象继续递归
            if (
                item &&
                typeof item === "object"
            ) {
                result.push(
                    cleanObject(item, depth + 1)
                );
                continue;
            }

            // 字符串广告 URL 删除
            if (isAdUrl(item)) {
                continue;
            }

            result.push(item);
        }

        return result;
    }


    // =========================================================
    // 清理对象
    // =========================================================

    function cleanObject(obj, depth) {

        if (!obj || typeof obj !== "object") {
            return obj;
        }

        // 防止异常递归
        if (depth > 25) {
            return obj;
        }


        // -----------------------------------------------------
        // 第一层：删除明确广告字段
        // -----------------------------------------------------

        for (const key of Object.keys(obj)) {

            if (AD_KEYS.has(key)) {
                delete obj[key];
            }
        }


        // -----------------------------------------------------
        // 第二层：清除广告标志
        // -----------------------------------------------------

        cleanFlags(obj);


        // -----------------------------------------------------
        // 第三层：处理对象内容
        // -----------------------------------------------------

        for (const key of Object.keys(obj)) {

            const value = obj[key];

            // null
            if (value === null) {
                continue;
            }


            // Array
            if (Array.isArray(value)) {

                obj[key] = cleanArray(
                    value,
                    depth + 1
                );

                continue;
            }


            // Object
            if (
                typeof value === "object"
            ) {

                // 明确广告对象
                if (isAdObject(value)) {

                    delete obj[key];

                    continue;
                }

                obj[key] = cleanObject(
                    value,
                    depth + 1
                );

                continue;
            }


            // 字符串 URL
            if (
                typeof value === "string" &&
                isAdUrl(value)
            ) {

                delete obj[key];
            }
        }


        // -----------------------------------------------------
        // 第四层：常见推荐/广告列表
        // -----------------------------------------------------

        const LIST_KEYS = [
            "cell_list",
            "cellList",

            "feed",
            "feed_list",
            "feedList",

            "recommend",
            "recommend_list",
            "recommendList",

            "recommend_data",
            "recommendData",

            "ad_list",
            "adList"
        ];

        for (const key of LIST_KEYS) {

            if (Array.isArray(obj[key])) {

                obj[key] = obj[key].filter(
                    item => !isAdObject(item)
                );
            }
        }


        return obj;
    }


    // =========================================================
    // 执行
    // =========================================================

    obj = cleanObject(obj, 0);


    // =========================================================
    // 输出
    // =========================================================

    $done({
        body: JSON.stringify(obj)
    });


} catch (e) {

    // 非 JSON / 压缩格式 / 异常响应
    // 不破坏原始响应

    $done({
        body: body
    });
}
