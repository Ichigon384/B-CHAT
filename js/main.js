// ========================================
// B-CHAT
// 共通処理
// ========================================


// ========================================
// Supabase
// ========================================

const SUPABASE_URL =
    "https://wzmlzqxdtztejdflakio.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_sE2rAdafCAy4nZDFgcfKXA_wHhEb5kx";


window.supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ========================================
// ログイン状態を確認
// ========================================

async function checkAuth() {

    const authLink =
        document.getElementById(
            "auth-link"
        );


    // auth-linkがないページでは何もしない
    if (!authLink) {
        return;
    }


    // ------------------------------------
    // 現在のセッションを取得
    // ------------------------------------

    const {
        data,
        error
    } =
        await window.supabaseClient
            .auth
            .getSession();


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "セッション取得エラー:",
            error
        );

        return;

    }


    const session =
        data.session;


    // ------------------------------------
    // 未ログイン
    // ------------------------------------

    if (!session) {

        authLink.innerHTML = `

            <a href="login.html">
                ログイン
            </a>

        `;

        return;

    }


    // ------------------------------------
    // ログイン済み
    // ------------------------------------

    const user =
        session.user;


    authLink.innerHTML = `

        <span class="user-email">

            ${escapeHTML(
                user.email
            )}

        </span>

        <button
            id="logout-button"
            class="logout-button"
        >
            ログアウト
        </button>

    `;


    // ------------------------------------
    // ログアウト
    // ------------------------------------

    const logoutButton =
        document.getElementById(
            "logout-button"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                const {
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signOut();


                if (error) {

                    console.error(
                        "ログアウトエラー:",
                        error
                    );

                    return;

                }


                // ログアウト後にページを再読み込み

                window.location.reload();

            }
        );

    }

}


// ========================================
// 新着スレッド
// ========================================

async function loadLatestThreads() {

    const latestThreads =
        document.getElementById(
            "latest-threads"
        );


    // ------------------------------------
    // 新着スレッド表示エリアがないページ
    // ------------------------------------

    if (!latestThreads) {
        return;
    }


    // ------------------------------------
    // 読み込み中
    // ------------------------------------

    latestThreads.innerHTML = `

        <p>
            新着スレッドを読み込んでいます...
        </p>

    `;


    // ------------------------------------
    // スレッド取得
    // 最新3件
    // ------------------------------------

    const {
        data: threads,
        error: threadsError
    } =
        await window.supabaseClient

            .from("threads")

            .select(
                "id, title, category, content, user_id, created_at"
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            )

            .limit(3);


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (threadsError) {

        console.error(
            "新着スレッド取得エラー:",
            threadsError
        );


        latestThreads.innerHTML = `

            <p>
                新着スレッドを取得できませんでした。
            </p>

        `;

        return;

    }


    // ------------------------------------
    // スレッド0件
    // ------------------------------------

    if (
        !threads ||
        threads.length === 0
    ) {

        latestThreads.innerHTML = `

            <p>
                まだスレッドがありません。
            </p>

        `;

        return;

    }


    // ====================================
    // 返信数を取得
    // ====================================

    const threadIds =
        threads.map(
            function (thread) {

                return thread.id;

            }
        );


    let replies = [];


    if (threadIds.length > 0) {

        const {
            data: replyData,
            error: repliesError
        } =
            await window.supabaseClient

                .from("replies")

                .select(
                    "thread_id"
                )

                .in(
                    "thread_id",
                    threadIds
                );


        if (repliesError) {

            console.error(
                "返信数取得エラー:",
                repliesError
            );

        } else {

            replies =
                replyData || [];

        }

    }


    // ------------------------------------
    // 返信数をMap化
    // ------------------------------------

    const replyCountMap =
        new Map();


    replies.forEach(
        function (reply) {

            const currentCount =
                replyCountMap.get(
                    reply.thread_id
                ) || 0;


            replyCountMap.set(
                reply.thread_id,
                currentCount + 1
            );

        }
    );


    // ====================================
    // HTML生成
    // ====================================

    latestThreads.innerHTML = "";


    threads.forEach(
        function (thread) {

            const replyCount =
                replyCountMap.get(
                    thread.id
                ) || 0;


            const article =
                document.createElement(
                    "a"
                );


            article.href =
                "thread.html?id=" +
                encodeURIComponent(
                    thread.id
                );


            article.className =
                "thread";


            article.innerHTML = `

                <div class="thread-main">

                    <h3>
                        ${escapeHTML(
                            thread.title
                        )}
                    </h3>


                    <div class="tags">

                        <span>
                            #${escapeHTML(
                                thread.category
                            )}
                        </span>

                    </div>

                </div>


                <div class="thread-info">

                    <span>
                        ${replyCount}レス
                    </span>

                    <span>
                        ${formatRelativeTime(
                            thread.created_at
                        )}
                    </span>

                </div>

            `;


            latestThreads.appendChild(
                article
            );

        }
    );

}


// ========================================
// 相対時間
// ========================================

function formatRelativeTime(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const now =
        new Date();


    const diff =
        now.getTime() -
        date.getTime();


    const seconds =
        Math.floor(
            diff / 1000
        );


    // ------------------------------------
    // 未来の日付
    // ------------------------------------

    if (seconds < 0) {

        return "たった今";

    }


    // ------------------------------------
    // 1分未満
    // ------------------------------------

    if (seconds < 60) {

        return "たった今";

    }


    // ------------------------------------
    // 分
    // ------------------------------------

    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return (
            minutes +
            "分前"
        );

    }


    // ------------------------------------
    // 時間
    // ------------------------------------

    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return (
            hours +
            "時間前"
        );

    }


    // ------------------------------------
    // 日
    // ------------------------------------

    const days =
        Math.floor(
            hours / 24
        );


    if (days < 30) {

        return (
            days +
            "日前"
        );

    }


    // ------------------------------------
    // それ以上
    // ------------------------------------

    return date.toLocaleDateString(
        "ja-JP",
        {
            year: "numeric",
            month: "numeric",
            day: "numeric"
        }
    );

}


// ========================================
// HTMLエスケープ
// ========================================

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


// ========================================
// 実行
// ========================================

checkAuth();

loadLatestThreads();
