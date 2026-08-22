/*
 * 🍅 番茄小说 iOS 去广告 Enhanced
 *
 * Loon / Surge / Shadowrocket
 *
 * 核心：
 * 1. 深度清理广告对象
 * 2. 清理广告字段
 * 3. 清理广告标志
 * 4. 清理广告 URL
 * 5. 清理广告数组
 * 6. 保留正常小说正文
 *
 * 不依赖 BoxJs
 */

const body = $response.body;

if (!body) {
    $done({});
    return;
}


/* =========================================================
 * 工具
 * ========================================================= */

function lower(v) {
    return String(v || "").toLowerCase();
}


function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}


/* =========================================================
 * 广告字段
 * ========================================================= */

const AD_KEYS = new Set([

    // 基础
    "ad",
    "ads",
    "advert",
    "advertisement",
    "advertisements",

    // info
    "ad_info",
    "adInfo",
    "ad_data",
    "adData",
    "ad_detail",
    "adDetail",
    "ad_details",
    "adDetails",

    // config
    "ad_config",
    "adConfig",
    "ad_setting",
    "adSetting",
    "ad_settings",
    "adSettings",

    // placement
    "ad_placement",
    "adPlacement",
    "ad_position",
    "adPosition",

    // cell
    "ad_cell",
    "adCell",
    "ad_component",
    "adComponent",

    // banner
    "banner_ad",
    "bannerAd",
    "banner_ads",
    "bannerAds",

    "bottom_ad",
    "bottomAd",
    "bottom_banner_ad",
    "bottomBannerAd",

    "top_ad",
    "topAd",

    "middle_ad",
    "middleAd",

    // reader
    "reader_ad",
    "readerAd",
    "reader_banner",
    "readerBanner",

    "chapter_ad",
    "chapterAd",

    "page_ad",
    "pageAd",

    "next_ad",
    "nextAd",

    // video
    "video_ad",
    "videoAd",

    "interstitial_ad",
    "interstitialAd",

    "splash_ad",
    "splashAd",

    "reward_ad",
    "rewardAd",

    "rewarded_ad",
    "rewardedAd",

    "after_video_ad",
    "afterVideoAd",

    "post_reward_ad",
    "postRewardAd",

    // feed
    "feed_ad",
    "feedAd",

    "native_ad",
    "nativeAd",

    "custom_ad",
    "customAd",

    "live_ad",
    "liveAd",

    // list
    "ad_list",
    "adList",

    "ad_items",
    "adItems",

    "ad_list_data",
    "adListData",

    // novel
    "novel_ad_data",
    "novelAdData",

    // bidding
    "bidding_ad",
    "biddingAd",

    "bidding_ad_list",
    "biddingAdList",

    // other
    "ad_material",
    "adMaterial",

    "creative",
    "creative_info",
    "creativeInfo",

    "advert_info",
    "advertInfo"
]);


/* =========================================================
 * 广告标志
 * ========================================================= */

const FLAG_KEYS = [

    "has_ad",
    "hasAd",

    "ad_exist",
    "adExist",

    "show_ad",
    "showAd",

    "is_ad",
    "isAd",

    "is_advertisement",
    "isAdvertisement",

    "need_ad",
    "needAd",

    "enable_ad",
    "enableAd",

    "has_more_ineffective_ad"
];


/* =========================================================
 * 判断字符串是否明显为广告
 * ========================================================= */

function isAdString(value) {

    if (typeof value !== "string") {
        return false;
    }

    const s = value.toLowerCase();

    return (

        s.includes("pangolin-sdk") ||
        s.includes("pglstatp") ||
        s.includes("pstatp") ||
        s.includes("ad-sign") ||
        s.includes("adsby") ||
        s.includes("snssdk.com/api/ad") ||
        s.includes("byteimg.com/ad") ||
        s.includes("toutiao.mp4") ||
        s.includes("ad-app-package") ||
        s.includes("web.business.image") ||
        s.includes("dig.bdurl.net")
    );
}


/* =========================================================
 * 判断对象是不是广告
 * ========================================================= */

function isAdObject(item) {

    if (!item || typeof item !== "object") {
        return false;
    }


    // ---------------------------------------------
    // 明确广告字段
    // ---------------------------------------------

    if (
        hasOwn(item, "ad_info") ||
        hasOwn(item, "adInfo") ||
        hasOwn(item, "ad_data") ||
        hasOwn(item, "adData") ||
        hasOwn(item, "advertisement") ||
        hasOwn(item, "advertisements")
    ) {
        return true;
    }


    // ---------------------------------------------
    // 广告 ID
    // ---------------------------------------------

    if (
        hasOwn(item, "ad_id") ||
        hasOwn(item, "adId") ||
        hasOwn(item, "creative_id") ||
        hasOwn(item, "creativeId")
    ) {
        return true;
    }


    // ---------------------------------------------
    // 广告布尔标志
    // ---------------------------------------------

    if (
        item.is_ad === true ||
        item.isAd === true ||
        item.is_advertisement === true ||
        item.isAdvertisement === true
    ) {
        return true;
    }


    // ---------------------------------------------
    // 类型
    // ---------------------------------------------

    const type = lower(
        item.type ||
        item.cell_type ||
        item.cellType ||
        item.item_type ||
        item.itemType ||
        item.data_type ||
        item.dataType ||
        item.component_type ||
        item.componentType
    );


    const AD_TYPES = [

        "ad",
        "ads",
        "advert",
        "advertisement",

        "native_ad",
        "nativead",

        "banner_ad",
        "bannerad",

        "feed_ad",
        "feedad",

        "interstitial_ad",
        "interstitialad",

        "reward_ad",
        "rewardad",

        "video_ad",
        "videoad",

        "splash_ad",
        "splashad"
    ];


    if (AD_TYPES.includes(type)) {
        return true;
    }


    // ---------------------------------------------
    // 广告 URL
    // ---------------------------------------------

    const urlFields = [

        "url",
        "click_url",
        "clickUrl",
        "landing_url",
        "landingUrl",
        "image_url",
        "imageUrl",
        "video_url",
        "videoUrl",
        "download_url",
        "downloadUrl"
    ];


    for (const key of urlFields) {

        if (isAdString(item[key])) {
            return true;
        }
    }


    // ---------------------------------------------
    // 广告 SDK 标记
    // ---------------------------------------------

    const sdkText = [

        item.sdk,
        item.sdk_name,
        item.sdkName,
        item.source,
        item.source_name,
        item.sourceName,
        item.ad_source,
        item.adSource
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


    if (
        sdkText.includes("pangolin") ||
        sdkText.includes("pangle") ||
        sdkText.includes("toutiao") ||
        sdkText.includes("bytedance")
    ) {
        return true;
    }


    return false;
}


/* =========================================================
 * 清除广告标志
 * ========================================================= */

function cleanFlags(obj) {

    for (const key of FLAG_KEYS) {

        if (!hasOwn(obj, key)) {
            continue;
        }


        if (key === "has_more_ineffective_ad") {
            obj[key] = 0;
        }

        else if (
            key === "has_ad" ||
            key === "hasAd" ||
            key === "ad_exist" ||
            key === "adExist" ||
            key === "show_ad" ||
            key === "showAd" ||
            key === "is_ad" ||
            key === "isAd" ||
            key === "is_advertisement" ||
            key === "isAdvertisement" ||
            key === "need_ad" ||
            key === "needAd" ||
            key === "enable_ad" ||
            key === "enableAd"
        ) {

            obj[key] = false;
        }
    }
}


/* =========================================================
 * 清理数组
 * ========================================================= */

function cleanArray(arr, depth) {

    const result = [];

    for (const item of arr) {

        if (isAdObject(item)) {
            continue;
        }

        result.push(clean(item, depth + 1));
    }

    return result;
}


/* =========================================================
 * 清理对象
 * ========================================================= */

function clean(obj, depth) {

    if (depth > 60) {
        return obj;
    }


    if (
        obj === null ||
        obj === undefined
    ) {
        return obj;
    }


    if (typeof obj !== "object") {

        if (isAdString(obj)) {
            return "";
        }

        return obj;
    }


    if (Array.isArray(obj)) {
        return cleanArray(obj, depth);
    }


    // =====================================================
    // 删除明确广告字段
    // =====================================================

    for (const key of Object.keys(obj)) {

        if (AD_KEYS.has(key)) {

            delete obj[key];

            continue;
        }
    }


    // =====================================================
    // 清除广告标志
    // =====================================================

    cleanFlags(obj);


    // =====================================================
    // 特殊数组
    // =====================================================

    const ARRAY_KEYS = [

        "cell_list",
        "cellList",

        "data",

        "list",

        "items",

        "feed",
        "feed_list",
        "feedList",

        "recommend",
        "recommend_list",
        "recommendList",

        "recommend_data",
        "recommendData",

        "module_list",
        "moduleList",

        "content_list",
        "contentList"
    ];


    for (const key of ARRAY_KEYS) {

        if (!Array.isArray(obj[key])) {
            continue;
        }


        obj[key] = obj[key].filter(
            item => !isAdObject(item)
        );
    }


    // =====================================================
    // 阅读页广告
    // =====================================================

    const READER_KEYS = [

        "reader_ad",
        "readerAd",

        "reader_banner",
        "readerBanner",

        "chapter_ad",
        "chapterAd",

        "page_ad",
        "pageAd",

        "next_ad",
        "nextAd",

        "bottom_ad",
        "bottomAd",

        "bottom_banner_ad",
        "bottomBannerAd"
    ];


    for (const key of READER_KEYS) {
        delete obj[key];
    }


    // =====================================================
    // 视频 / 激励广告
    // =====================================================

    const VIDEO_KEYS = [

        "video_ad",
        "videoAd",

        "reward_ad",
        "rewardAd",

        "rewarded_ad",
        "rewardedAd",

        "after_video_ad",
        "afterVideoAd",

        "post_reward_ad",
        "postRewardAd"
    ];


    for (const key of VIDEO_KEYS) {
        delete obj[key];
    }


    // =====================================================
    // 深层递归
    // =====================================================

    for (const key of Object.keys(obj)) {

        const value = obj[key];


        if (
            value === null ||
            value === undefined
        ) {
            continue;
        }


        // ---------------------------------------------
        // 嵌套对象
        // ---------------------------------------------

        if (typeof value === "object") {

            if (isAdObject(value)) {

                delete obj[key];

                continue;
            }


            obj[key] = clean(
                value,
                depth + 1
            );

            continue;
        }


        // ---------------------------------------------
        // 广告 URL 字符串
        // ---------------------------------------------

        if (
            typeof value === "string" &&
            isAdString(value)
        ) {

            obj[key] = "";
        }
    }


    return obj;
}


/* =========================================================
 * 执行
 * ========================================================= */

try {

    let parsed;


    try {

        parsed = JSON.parse(body);

    } catch (e) {

        // 某些接口可能是 JSON 字符串
        // 不解析就原样返回，避免破坏正文

        $done({
            body: body
        });

        return;
    }


    const result = clean(
        parsed,
        0
    );


    $done({
        body: JSON.stringify(result)
    });


} catch (e) {

    // 出错绝不破坏正文

    $done({
        body: body
    });
}
