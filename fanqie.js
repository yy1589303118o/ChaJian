/*
 * 🍅 番茄小说 iOS 去广告
 * fanqie.js
 *
 * Shadowrocket / Surge compatible
 * BoxJs configurable
 */

const PREFIX = "Fanqie_";

// ==============================
// 配置读取
// ==============================

function readBool(key, def) {
    try {
        let v = $persistentStore.read(PREFIX + key);
        if (v === null || v === undefined || v === "") return def;
        return String(v).toLowerCase() === "true" || v === "1";
    } catch (e) {
        return def;
    }
}

function readText(key, def) {
    try {
        let v = $persistentStore.read(PREFIX + key);
        return v === null || v === undefined ? def : String(v);
    } catch (e) {
        return def;
    }
}

const ENABLE = readBool("Enable", true);

if (!ENABLE) {
    $done({});
    return;
}

const REMOVE_AD_FIELDS = readBool("RemoveAdFields", true);
const REMOVE_AD_FLAGS = readBool("RemoveAdFlags", true);
const CLEAN_CELL_LIST = readBool("CleanCellList", true);
const CLEAN_DATA = readBool("CleanData", true);
const CLEAN_FEED = readBool("CleanFeed", true);
const CLEAN_READER = readBool("CleanReader", true);
const CLEAN_LIVE = readBool("CleanLive", true);
const STRICT_MODE = readBool("StrictMode", false);
const DEBUG = readBool("Debug", false);

const CUSTOM_KEYS = readText("CustomKeys", "");

// ==============================
// 广告字段
// ==============================

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

    "banner_ad",
    "bannerAd",
    "bottom_ad",
    "bottomAd",
    "middle_ad",
    "middleAd",
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

    "ad_position",
    "adPosition",

    "ad_list",
    "adList",
    "ads",
    "advertisement",
    "advertisements"
]);

// 自定义字段
if (CUSTOM_KEYS) {
    CUSTOM_KEYS
        .split(",")
        .map(x => x.trim())
        .filter(Boolean)
        .forEach(x => AD_KEYS.add(x));
}

// ==============================
// 广告标记
// ==============================

const AD_FLAGS = [
    "ad_exist",
    "adExist",
    "show_ad",
    "showAd",
    "is_ad",
    "isAd",
    "has_ad",
    "hasAd",
    "is_advertisement",
    "isAdvertisement",
    "is_sponsor",
    "isSponsor",
    "has_more_ineffective_ad"
];

// ==============================
// 判断对象是不是广告
// ==============================

function looksLikeAd(obj) {
    if (!obj || typeof obj !== "object") return false;

    // 明确广告字段
    if (obj.ad_info || obj.adInfo ||
        obj.ad_data || obj.adData ||
        obj.ad_id || obj.adId) {
        return true;
    }

    // 类型判断
    const type = String(
        obj.type ||
        obj.cell_type ||
        obj.item_type ||
        obj.data_type ||
        ""
    ).toLowerCase();

    if (
        type === "ad" ||
        type === "advertisement" ||
        type === "advert" ||
        type === "native_ad" ||
        type === "banner_ad" ||
        type === "feed_ad"
    ) {
        return true;
    }

    // 广告标识
    if (
        obj.is_ad === true ||
        obj.isAd === true ||
        obj.is_advertisement === true ||
        obj.isAdvertisement === true
    ) {
        return true;
    }

    return false;
}

// ==============================
// 清理数组
// ==============================

function cleanArray(arr, depth) {
    if (!Array.isArray(arr)) return arr;

    const result = [];

    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];

        if (
            item &&
            typeof item === "object" &&
            looksLikeAd(item)
        ) {
            continue;
        }

        result.push(clean(item, depth + 1));
    }

    return result;
}

// ==============================
// 核心递归清理
// ==============================

function clean(obj, depth = 0) {

    // 防止异常深度
    if (depth > 40) return obj;

    if (obj === null || obj === undefined) {
        return obj;
    }

    // 数组
    if (Array.isArray(obj)) {
        return cleanArray(obj, depth);
    }

    // 基础类型
    if (typeof obj !== "object") {
        return obj;
    }

    // ==========================
    // 第一阶段：字段删除
    // ==========================

    if (REMOVE_AD_FIELDS) {
        for (const key of Array.from(AD_KEYS)) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                delete obj[key];
            }
        }
    }

    // ==========================
    // 第二阶段：广告标志
    // ==========================

    if (REMOVE_AD_FLAGS) {

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
    }

    // ==========================
    // cell_list
    // ==========================

    if (
        CLEAN_CELL_LIST &&
        Array.isArray(obj.cell_list)
    ) {

        obj.cell_list = obj.cell_list.filter(item => {

            if (!item || typeof item !== "object") {
                return true;
            }

            if (looksLikeAd(item)) {
                return false;
            }

            const type = String(
                item.type ||
                item.cell_type ||
                item.item_type ||
                ""
            ).toLowerCase();

            if (
                type === "ad" ||
                type === "advertisement" ||
                type === "native_ad" ||
                type === "banner_ad"
            ) {
                return false;
            }

            return true;
        });
    }

    // ==========================
    // data
    // ==========================

    if (
        CLEAN_DATA &&
        Array.isArray(obj.data)
    ) {

        obj.data = obj.data.filter(item => {

            if (!item || typeof item !== "object") {
                return true;
            }

            return !looksLikeAd(item);
        });
    }

    // ==========================
    // feed / 推荐流
    // ==========================

    if (CLEAN_FEED) {

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
                    return !looksLikeAd(item);
                });
            }
        }
    }

    // ==========================
    // 阅读页
    // ==========================

    if (CLEAN_READER) {

        const readerKeys = [
            "reader",
            "reader_data",
            "readerData",
            "reading",
            "reading_data",
            "readingData",
            "chapter",
            "chapter_data",
            "chapterData",
            "chapter_list",
            "chapterList"
        ];

        for (const key of readerKeys) {

            if (
                obj[key] &&
                typeof obj[key] === "object"
            ) {

                if (looksLikeAd(obj[key])) {
                    delete obj[key];
                }
            }
        }
    }

    // ==========================
    // 直播 / 视频
    // ==========================

    if (CLEAN_LIVE) {

        const liveKeys = [
            "live",
            "live_info",
            "liveInfo",
            "live_card",
            "liveCard",
            "live_component",
            "liveComponent",
            "video_ad",
            "videoAd"
        ];

        for (const key of liveKeys) {
            if (key in obj) {
                delete obj[key];
            }
        }
    }

    // ==========================
    // 深度递归
    // ==========================

    for (const key of Object.keys(obj)) {

        const value = obj[key];

        if (
            value &&
            typeof value === "object"
        ) {

            // 严格模式下，发现明确广告对象直接删除
            if (
                STRICT_MODE &&
                looksLikeAd(value)
            ) {
                delete obj[key];
                continue;
            }

            obj[key] = clean(value, depth + 1);
        }
    }

    return obj;
}

// ==============================
// 主程序
// ==============================

let body = $response.body;

if (!body) {
    $done({});
    return;
}

// 太大的非 JSON 响应不处理
if (
    typeof body !== "string" ||
    body.length === 0
) {
    $done({ body });
    return;
}

try {

    const obj = JSON.parse(body);

    const cleaned = clean(obj);

    const output = JSON.stringify(cleaned);

    if (DEBUG) {
        try {
            console.log(
                "[Fanqie] cleaned: " +
                body.length +
                " -> " +
                output.length
            );
        } catch (e) {}
    }

    $done({
        body: output
    });

} catch (e) {

    // JSON 解析失败绝对不要破坏原响应
    if (DEBUG) {
        try {
            console.log("[Fanqie] JSON parse failed");
        } catch (e2) {}
    }

    $done({
        body: body
    });
}
