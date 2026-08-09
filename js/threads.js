// ========================================
// B-CHAT
// スレッド一覧
// ========================================

// ----------------------------------------
// URLパラメータ
// ----------------------------------------

const params =
    new URLSearchParams(
        window.location.search
    );

const category =
    params.get("category");


// ----------------------------------------
// 要素
// ----------------------------------------

const threadList =
    document.getElementById(
        "thread-list"
    );

const searchInput =
    document.getElementById(
        "thread-search-input"
    );

const searchButton =
    document.getElementById(
        "thread-search-button"
    );

const searchResult =
    document.getElementById(
        "thread-search-result"
    );

const categoryTitle =
    document.getElementById(
        "category-title"
    );

const categoryDescription =
    document.getElementById(
        "category-description"
    );

const breadcrumb =
    document.getElementById(
        "breadcrumb"
    );

const sortSelect =
    document.getElementById(
        "thread-sort"
    );


// ----------------------------------------
// ジャンル情報
// ----------------------------------------

const categoryDescriptions = {

    "ボール":
        "ボウリングボールについてのスレッド",

    "レーン":
        "レーンコンディションやレーン材についてのスレッド",

    "投球":
        "投球フォームや技術についてのスレッド",

    "大会":
        "大会・トーナメントについてのスレッド",

    "その他":
        "その他のボウリングに関するスレッド"

};


// ----------------------------------------
// ページタイトル
// ----------------------------------------

function setupCategory() {

    if (category) {

        const description =
            categoryDescriptions[
                category
            ] ||
            "このジャンルのスレッド";


        if (categoryTitle) {

            categoryTitle.textContent =
                category;

        }


        if (categoryDescription) {

            categoryDescription.textContent =
                description;

        }


        if (breadcrumb) {

            breadcrumb.textContent =
                `B-CHAT / ジャンル / ${category}`;

        }

    } else {

        if (categoryTitle) {

            categoryTitle.textContent =
                "すべてのスレッド";

        }


        if (categoryDescription) {

            categoryDescription.textContent =
                "ボウリングに関するすべてのスレッド";

        }


        if (breadcrumb) {

            breadcrumb.textContent =
                "B-CHAT / ジャンル";

        }

    }

}


// ----------------------------------------
// スレッド取得
// ----------------------------------------

async function loadThreads(
    searchKeyword = ""
) {

    if (!threadList) {

        console.error(
            "thread-listが見つかりません。"
        );

        return;

    }


    threadList.innerHTML = "";


    // ------------------------------------
    // 基本クエリ
    // ------------------------------------

    let query =
        window.supabaseClient

            .from("threads")

            .select("*");


    // ------------------------------------
    // ジャンル
    // ------------------------------------

    if (category) {

        query =
            query.eq(
                "category",
                category
            );

    }


    // ------------------------------------
    // キーワード検索
    // ------------------------------------

    const keyword =
        searchKeyword.trim();


    if (keyword) {

        const escapedKeyword =
            keyword
                .replace(
                    /%/g,
                    "\\%"
                )
                .replace(
                    /_/g,
                    "\\_"
                );


        query =
            query.or(

                `title.ilike.%${escapedKeyword}%,` +
                `content.ilike.%${escapedKeyword}%,` +
                `category.ilike.%${escapedKeyword}%,` +
                `username.ilike.%${escapedKeyword}%`

            );

    }


    // ------------------------------------
    // 並び替え
    // ------------------------------------

    const sort =
        sortSelect
            ? sortSelect.value
            : "newest";


    // ------------------------------------
    // 新着順
    // ------------------------------------

    if (
        sort === "newest"
    ) {

        query =
            query.order(
                "created_at",
                {
                    ascending: false
                }
            );

    }


    // ------------------------------------
    // レス数順
    // ------------------------------------

    else if (
        sort === "replies"
    ) {

        query =
            query.order(
                "reply_count",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );


        // 同じレス数の場合は新しい順

        query =
            query.order(
                "created_at",
                {
                    ascending: false
                }
            );

    }


    // ------------------------------------
    // 更新順
    // ------------------------------------

    else if (
        sort === "updated"
    ) {

        query =
            query.order(
                "updated_at",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );


        // 同じ更新日時の場合は新しい順

        query =
            query.order(
                "created_at",
                {
                    ascending: false
                }
            );

    }


    // ------------------------------------
    // 実行
    // ------------------------------------

    const {
        data,
        error
    } =
        await query;


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "スレッド取得エラー:",
            error
        );


        threadList.innerHTML = `

            <p>
                スレッドを取得できませんでした。
            </p>

        `;

        return;

    }


    // ------------------------------------
    // 件数
    // ------------------------------------

    if (searchResult) {

        if (keyword) {

            searchResult.textContent =
                `「${keyword}」の検索結果：${data.length}件`;

        } else {

            searchResult.textContent =
                `${data.length}件のスレッド`;

        }

    }


    // ------------------------------------
    // 0件
    // ------------------------------------

    if (
        !data ||
        data.length === 0
    ) {

        threadList.innerHTML = `

            <div class="no-threads">

                <p>

                    ${
                        keyword
                        ? "検索結果がありません。"
                        : "このジャンルにはまだスレッドがありません。"
                    }

                </p>

            </div>

        `;

        return;

    }


    // ------------------------------------
    // 表示
    // ------------------------------------

    data.forEach(
        (thread) => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "thread-card";


            article.innerHTML = `

                <a
                    href="thread.html?id=${thread.id}"
                    class="thread-card-link"
                >

                    <div class="thread-card-category">

                        #${escapeHTML(
                            thread.category
                        )}

                    </div>


                    <h2>

                        ${escapeHTML(
                            thread.title
                        )}

                    </h2>


                    <p class="thread-card-content">

                        ${escapeHTML(
                            thread.content
                        )}

                    </p>


                    <div class="thread-card-meta">

                        <span>

                            ${escapeHTML(
                                thread.username
                            )}

                        </span>


                        <span>

                            ${formatDate(
                                thread.created_at
                            )}

                        </span>


                        <span class="thread-card-replies">

                            💬
                            ${thread.reply_count || 0}
                            件の返信

                        </span>

                    </div>

                </a>

            `;


            threadList.appendChild(
                article
            );

        }
    );

}


// ----------------------------------------
// 検索
// ----------------------------------------

function searchThreads() {

    const keyword =
        searchInput
            ? searchInput.value
            : "";


    loadThreads(
        keyword
    );

}


// ----------------------------------------
// 検索ボタン
// ----------------------------------------

if (searchButton) {

    searchButton.addEventListener(
        "click",
        searchThreads
    );

}


// ----------------------------------------
// Enterキー
// ----------------------------------------

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                searchThreads();

            }

        }
    );

}


// ----------------------------------------
// 並び替え
// ----------------------------------------

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        function() {

            const keyword =
                searchInput
                    ? searchInput.value
                    : "";


            loadThreads(
                keyword
            );

        }
    );

}


// ----------------------------------------
// 日付
// ----------------------------------------

function formatDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    return date.toLocaleString(
        "ja-JP",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ----------------------------------------
// XSS対策
// ----------------------------------------

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ----------------------------------------
// 初期化
// ----------------------------------------

setupCategory();

loadThreads();