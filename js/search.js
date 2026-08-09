// ========================================
// B-CHAT
// 全体検索
// ========================================


// ----------------------------------------
// 要素
// ----------------------------------------

const searchInput =
    document.getElementById(
        "global-search-input"
    );


const searchButton =
    document.getElementById(
        "global-search-button"
    );


const searchResults =
    document.getElementById(
        "search-results"
    );


const resultCount =
    document.getElementById(
        "search-result-count"
    );


// ----------------------------------------
// URLからキーワード取得
// ----------------------------------------

const params =
    new URLSearchParams(
        window.location.search
    );


const initialKeyword =
    params.get("q");


// ----------------------------------------
// 初期キーワード
// ----------------------------------------

if (initialKeyword) {

    searchInput.value =
        initialKeyword;

    searchThreads(
        initialKeyword
    );

}


// ----------------------------------------
// 検索
// ----------------------------------------

async function searchThreads(
    keyword
) {

    keyword =
        keyword.trim();


    // ----------------------------
    // 空検索
    // ----------------------------

    if (!keyword) {

        resultCount.textContent =
            "";

        searchResults.innerHTML = `

            <div class="no-threads">

                <p>
                    キーワードを入力してください。
                </p>

            </div>

        `;

        return;
    }


    // ----------------------------
    // 検索中
    // ----------------------------

    resultCount.textContent =
        "検索しています...";


    searchResults.innerHTML =
        "";


    // ----------------------------
    // Supabase検索
    // ----------------------------

    const {
        data,
        error
    } =
        await window.supabaseClient

            .from("threads")

            .select("*")

            .or(
                `title.ilike.%${escapeSearchKeyword(keyword)}%,` +
                `content.ilike.%${escapeSearchKeyword(keyword)}%,` +
                `category.ilike.%${escapeSearchKeyword(keyword)}%`
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    // ----------------------------
    // エラー
    // ----------------------------

    if (error) {

        console.error(
            "検索エラー:",
            error
        );


        resultCount.textContent =
            "";


        searchResults.innerHTML = `

            <div class="no-threads">

                <p>
                    検索に失敗しました。
                </p>

            </div>

        `;

        return;
    }


    // ----------------------------
    // 件数
    // ----------------------------

    resultCount.textContent =
        `「${keyword}」の検索結果：${data.length}件`;


    // ----------------------------
    // 0件
    // ----------------------------

    if (
        !data ||
        data.length === 0
    ) {

        searchResults.innerHTML = `

            <div class="no-threads">

                <p>
                    「${escapeHTML(keyword)}」
                    に一致するスレッドはありません。
                </p>

            </div>

        `;

        return;
    }


    // ----------------------------
    // 表示
    // ----------------------------

    data.forEach(
        function(thread) {

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


                    <div
                        class="thread-card-category"
                    >

                        #${escapeHTML(
                            thread.category
                        )}

                    </div>


                    <h2>

                        ${escapeHTML(
                            thread.title
                        )}

                    </h2>


                    <p
                        class="thread-card-content"
                    >

                        ${escapeHTML(
                            thread.content
                        )}

                    </p>


                    <div
                        class="thread-card-meta"
                    >

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

                    </div>


                </a>

            `;


            searchResults.appendChild(
                article
            );

        }
    );

}


// ----------------------------------------
// 検索ボタン
// ----------------------------------------

searchButton.addEventListener(
    "click",
    function() {

        const keyword =
            searchInput.value;


        searchThreads(
            keyword
        );


        // URL更新

        const url =
            new URL(
                window.location
            );


        if (keyword.trim()) {

            url.searchParams.set(
                "q",
                keyword.trim()
            );

        } else {

            url.searchParams.delete(
                "q"
            );

        }


        window.history.replaceState(
            {},
            "",
            url
        );

    }
);


// ----------------------------------------
// Enter
// ----------------------------------------

searchInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            searchButton.click();

        }

    }
);


// ----------------------------------------
// 検索文字列
// ----------------------------------------

function escapeSearchKeyword(
    value
) {

    return value

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /%/g,
            "\\%"
        )

        .replace(
            /_/g,
            "\\_"
        );

}


// ----------------------------------------
// HTMLエスケープ
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
// 日付
// ----------------------------------------

function formatDate(
    dateString
) {

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
