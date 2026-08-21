/*
 * 🍅 番茄小说 iOS 去广告
 * fanqie.js
 *
 * Shadowrocket / Loon / Surge
 * 无 BoxJs 依赖版
 */

let body = $response.body;

if (!body) {
    $done({});
    return;
}

try {
    const obj = JSON.parse(body);

    // ==============================
    // 广告字段
    // ==============================

    const adKeys = new Set([
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

        "banner_ad",
        "bannerAd",
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
        "novel_ad_data",
        "novelAdData",

        "interstitial_ad",
        "interstitialAd",
        "splash_ad",
        "splashAd",
        "segment_ad",
        "segmentAd",

        "custom_ad",
        "customAd",
        "feed_ad",
        "feedAd",
        "native_ad",
        "nativeAd",

        "live_ad",
        "liveAd",
        "live_info",
        "liveInfo",
        "live_card",
        "liveCard",
        "live_component",
        "liveComponent",

        "after_video_ad",
        "afterVideoAd",
        "post_reward_ad",
        "postRewardAd",

        "page_ad",
        "pageAd",
        "next_ad",
        "nextAd",
        "chapter_ad",
        "chapterAd",
        "pop_ad",
        "popAd",

        "bidding_ad",
        "biddingAd",
        "bidding_ad_list",
        "biddingAdList",

        "reader_banner",
        "readerBanner",
        "bottom_banner_ad",
        "bottomBannerAd",

        "ad_component",
        "adComponent",
        "ad_list",
        "adList",
        "advertisement",
        "advertisements"
    ]);

    // ==============================
    // 广告标志
    // ==============================

    function cleanFlags(obj) {

        if ("has_more_ineffective_ad" in obj) {
            obj.has_more_ineffective_ad = 0;
        }

        if ("ad_exist" in obj) {
            obj.ad_exist = false;
        }

        if ("adExist" in obj) {
            obj.adExist = false;
        }

        if ("show_ad" in obj) {
            obj.show_ad = false;
        }

        if ("showAd" in obj) {
            obj.showAd = false;
        }

        if ("is_ad" in obj) {
            obj.is_ad = false;
        }

        if ("isAd" in obj) {
            obj.isAd = false;
        }

        if ("has_ad" in obj) {
            obj.has_ad = false;
        }

        if ("hasAd" in obj) {
            obj.hasAd = false;
        }

        if ("is_advertisement" in obj) {
            obj.is_advertisement = false;
        }

        if ("isAdvertisement" in obj) {
            obj.isAdvertisement = false;
        }
    }

    // ==============================
    // 判断广告对象
    // ==============================

    function isAdObject(item) {

        if (!item || typeof item !== "object") {
            return false;
        }

        // 明确广告字段
        if (
            item.ad_info ||
            item.adInfo ||
            item.ad_data ||
            item.adData ||
            item.ad_id ||
            item.adId
        ) {
            return true;
        }

        // 广告标志
        if (
            item.is_ad === true ||
            item.isAd === true ||
            item.is_advertisement === true ||
            item.isAdvertisement === true
        ) {
            return true;
        }

        // 类型
        const type = String(
            item.type ||
            item.cell_type ||
            item.item_type ||
            item.data_type ||
            ""
        ).toLowerCase();

        if (
            type === "ad" ||
            type === "advert" ||
            type === "advertisement" ||
            type === "native_ad" ||
            type === "banner_ad" ||
            type === "feed_ad" ||
            type === "interstitial_ad"
        ) {
            return true;
        }

        return false;
    }

    // ==============================
    // 清理数组
    // ==============================

    function cleanArray(arr, depth) {

        if (!Array.isArray(arr)) {
            return arr;
        }

        const result = [];

        for (const item of arr) {

            if (isAdObject(item)) {
                continue;
            }

            result.push(clean(item, depth + 1));
        }

        return result;
    }

    // ==============================
    // 核心清理
    // ==============================

    function clean(obj, depth) {

        if (depth > 40) {
            return obj;
        }

        if (obj === null || obj === undefined) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return cleanArray(obj, depth);
        }

        if (typeof obj !== "object") {
            return obj;
        }

        // ------------------------------
        // 删除广告字段
        // ------------------------------

        for (const key of adKeys) {

            if (
                Object.prototype.hasOwnProperty.call(
                    obj,
                    key
                )
            ) {
                delete obj[key];
            }
        }

        // ------------------------------
        // 清除广告标志
        // ------------------------------

        cleanFlags(obj);

        // ------------------------------
        // cell_list
        // ------------------------------

        if (Array.isArray(obj.cell_list)) {

            obj.cell_list = obj.cell_list.filter(item => {

                if (!item || typeof item !== "object") {
                    return true;
                }

                if (isAdObject(item)) {
                    return false;
                }

                const type = String(
                    item.type ||
                    item.cell_type ||
                    item.item_type ||
                    ""
                ).toLowerCase();

                return ![
                    "ad",
                    "advert",
                    "advertisement",
                    "native_ad",
                    "banner_ad",
                    "feed_ad"
                ].includes(type);
            });
        }

        // ------------------------------
        // data
        // ------------------------------

        if (Array.isArray(obj.data)) {

            obj.data = obj.data.filter(item => {
                return !isAdObject(item);
            });
        }

        // ------------------------------
        // 推荐流
        // ------------------------------

        const feedKeys = [
            "feed",
            "feed_list",
            "feedList",
            "recommend",
            "recommend_list",
            "recommendList",
            "recommend_data",
            "recommendData"
        ];

        for (const key of feedKeys) {

            if (Array.isArray(obj[key])) {

                obj[key] = obj[key].filter(item => {
                    return !isAdObject(item);
                });
            }
        }

        // ------------------------------
        // 阅读页相关
        // ------------------------------

        const readerKeys = [
            "reader_ad",
            "readerAd",
            "reader_banner",
            "readerBanner",
            "chapter_ad",
            "chapterAd",
            "page_ad",
            "pageAd",
            "next_ad",
            "nextAd"
        ];

        for (const key of readerKeys) {
            delete obj[key];
        }

        // ------------------------------
        // 直播 / 视频
        // ------------------------------

        const liveKeys = [
            "live_ad",
            "liveAd",
            "live_info",
            "liveInfo",
            "live_card",
            "liveCard",
            "live_component",
            "liveComponent",
            "video_ad",
            "videoAd",
            "after_video_ad",
            "afterVideoAd"
        ];

        for (const key of liveKeys) {
            delete obj[key];
        }

        // ------------------------------
        // 深度递归
        // ------------------------------

        for (const key of Object.keys(obj)) {

            const value = obj[key];

            if (
                value &&
                typeof value === "object"
            ) {

                if (isAdObject(value)) {
                    delete obj[key];
                    continue;
                }

                obj[key] = clean(
                    value,
                    depth + 1
                );
            }
        }

        return obj;
    }

    // ==============================
    // 执行
    // ==============================

    const result = clean(obj, 0);

    body = JSON.stringify(result);

    $done({
        body: body
    });

} catch (e) {

    // JSON 解析失败：
    // 原样返回，避免影响正文

    $done({
        body: body
    });
}