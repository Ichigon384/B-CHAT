// ========================================
// B-CHAT
// プロフィール
// ========================================

// ----------------------------------------
// URLパラメータ
// ----------------------------------------

const profileParams =
    new URLSearchParams(
        window.location.search
    );

// idが指定されていれば他ユーザー
const profileUserId =
    profileParams.get("id");


// ----------------------------------------
// 要素
// ----------------------------------------

const profileInfo =
    document.getElementById(
        "profile-info"
    );

const myThreads =
    document.getElementById(
        "my-threads"
    );

const myReplies =
    document.getElementById(
        "my-replies"
    );

const usernameInput =
    document.getElementById(
        "username-input"
    );

const usernameSaveButton =
    document.getElementById(
        "username-save-button"
    );

const usernameMessage =
    document.getElementById(
        "username-message"
    );


// ----------------------------------------
// 初期処理
// ----------------------------------------

loadProfile();


// ========================================
// プロフィール読み込み
// ========================================

async function loadProfile() {

    // ------------------------------------
    // ログインユーザー取得
    // ------------------------------------

    const {
        data: {
            user
        },
        error: userError
    } =
        await window.supabaseClient
            .auth
            .getUser();


    // ------------------------------------
    // 未ログイン
    // ------------------------------------

    if (
        userError ||
        !user
    ) {

        if (profileInfo) {

            profileInfo.innerHTML = `

                <div class="no-threads">

                    <p>
                        プロフィールを見るには
                        ログインしてください。
                    </p>

                    <a href="login.html">
                        ログインする
                    </a>

                </div>

            `;

        }

        return;

    }


    // ------------------------------------
    // 表示するユーザーID
    // ------------------------------------

    const targetUserId =
        profileUserId || user.id;


    // ------------------------------------
    // 自分のプロフィールか
    // ------------------------------------

    const isMyProfile =
        targetUserId === user.id;


    // ------------------------------------
    // profilesから情報取得
    // ------------------------------------

    const {
        data: profile,
        error: profileError
    } =
        await window.supabaseClient

            .from("profiles")

            .select("*")

            .eq(
                "id",
                targetUserId
            )

            .maybeSingle();


    // ------------------------------------
    // プロフィール取得エラー
    // ------------------------------------

    if (profileError) {

        console.error(
            "プロフィール取得エラー:",
            profileError
        );

    }


    // ------------------------------------
    // 表示名
    // ------------------------------------

    const displayName =
        profile?.username ||
        "ユーザー";


    // ------------------------------------
    // メールアドレス
    // 自分のプロフィールだけ表示
    // ------------------------------------

    let emailHTML = "";


    if (isMyProfile) {

        emailHTML = `

            <div class="profile-email">

                ${escapeHTML(
                    user.email
                )}

            </div>

        `;

    }


    // ------------------------------------
    // 登録日
    // 自分のプロフィールだけ表示
    // ------------------------------------

    let createdAtHTML = "";


    if (isMyProfile) {

        createdAtHTML = `

            <div class="profile-date">

                登録日：

                ${formatDate(
                    user.created_at
                )}

            </div>

        `;

    }


    // ------------------------------------
    // 通報ボタン
    // 他ユーザーだけ表示
    // ------------------------------------

    let reportButtonHTML = "";


    if (!isMyProfile) {

        reportButtonHTML = `

            <div class="profile-report-area">

                <button
                    type="button"
                    id="report-user-button"
                    class="report-user-button"
                >
                    このユーザーを通報
                </button>

            </div>

        `;

    }


    // ------------------------------------
    // プロフィール表示
    // ------------------------------------

    if (profileInfo) {

        profileInfo.innerHTML = `

            <div class="profile-card">

                <div class="profile-name">

                    ${escapeHTML(
                        displayName
                    )}

                </div>

                ${emailHTML}

                ${createdAtHTML}

                ${reportButtonHTML}

            </div>

        `;

    }


    // ====================================
    // 自分のプロフィール
    // ====================================

    if (isMyProfile) {

        // --------------------------------
        // 表示名入力欄
        // --------------------------------

        if (usernameInput) {

            usernameInput.value =
                profile?.username || "";

        }


        // --------------------------------
        // 自分のスレッド
        // --------------------------------

        await loadMyThreads(
            targetUserId
        );


        // --------------------------------
        // 自分の返信
        // --------------------------------

        await loadMyReplies(
            targetUserId
        );


        return;

    }


    // ====================================
    // 他ユーザーのプロフィール
    // ====================================

    // ------------------------------------
    // 表示名編集エリアを隠す
    // ------------------------------------

    if (usernameInput) {

        const parent =
            usernameInput.closest(
                ".form-group"
            ) ||
            usernameInput.parentElement;


        if (parent) {

            parent.style.display =
                "none";

        }

    }


    // ------------------------------------
    // 保存ボタンを隠す
    // ------------------------------------

    if (usernameSaveButton) {

        usernameSaveButton.style.display =
            "none";

    }


    // ------------------------------------
    // メッセージを隠す
    // ------------------------------------

    if (usernameMessage) {

        usernameMessage.style.display =
            "none";

    }


    // ------------------------------------
    // 他ユーザーのスレッド
    // ------------------------------------

    await loadMyThreads(
        targetUserId
    );


    // ------------------------------------
    // 他ユーザーの返信
    // ------------------------------------

    await loadMyReplies(
        targetUserId
    );


    // ------------------------------------
    // 通報ボタン
    // ------------------------------------

    const reportButton =
        document.getElementById(
            "report-user-button"
        );


    if (reportButton) {

        reportButton.addEventListener(
            "click",
            function () {

                showReportForm(
                    targetUserId,
                    displayName
                );

            }
        );

    }

}


// ========================================
// ユーザーのスレッド
// ========================================

async function loadMyThreads(
    userId
) {

    if (!myThreads) {
        return;
    }


    // ------------------------------------
    // スレッド取得
    // ------------------------------------

    const {
        data,
        error
    } =
        await window.supabaseClient

            .from("threads")

            .select("*")

            .eq(
                "user_id",
                userId
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "スレッド取得エラー:",
            error
        );


        myThreads.innerHTML = `

            <p>
                スレッドを取得できませんでした。
            </p>

        `;

        return;

    }


    // ------------------------------------
    // 0件
    // ------------------------------------

    if (
        !data ||
        data.length === 0
    ) {

        myThreads.innerHTML = `

            <div class="no-threads">

                <p>
                    まだスレッドを作成していません。
                </p>

            </div>

        `;

        return;

    }


    myThreads.innerHTML = "";


    // ------------------------------------
    // 表示
    // ------------------------------------

    data.forEach(
        function (thread) {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "thread-card";


            article.innerHTML = `

                <a
                    href="thread.html?id=${encodeURIComponent(thread.id)}"
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

                        ${formatDate(
                            thread.created_at
                        )}

                    </div>

                </a>

            `;


            myThreads.appendChild(
                article
            );

        }
    );

}


// ========================================
// ユーザーの返信
// ========================================

async function loadMyReplies(
    userId
) {

    if (!myReplies) {
        return;
    }


    /*
     * repliesとthreadsを別々に取得する。
     *
     * Supabase側でforeign key relationshipが
     * 認識されない環境でも動作するようにする。
     */


    // ------------------------------------
    // 返信取得
    // ------------------------------------

    const {
        data: replies,
        error: repliesError
    } =
        await window.supabaseClient

            .from("replies")

            .select("*")

            .eq(
                "user_id",
                userId
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    // ------------------------------------
    // 返信取得エラー
    // ------------------------------------

    if (repliesError) {

        console.error(
            "返信取得エラー:",
            repliesError
        );


        myReplies.innerHTML = `

            <p>
                返信を取得できませんでした。
            </p>

        `;

        return;

    }


    // ------------------------------------
    // 返信0件
    // ------------------------------------

    if (
        !replies ||
        replies.length === 0
    ) {

        myReplies.innerHTML = `

            <div class="no-threads">

                <p>
                    まだ返信を投稿していません。
                </p>

            </div>

        `;

        return;

    }


    // ------------------------------------
    // スレッドID一覧
    // ------------------------------------

    const threadIds =
        [
            ...new Set(
                replies
                    .map(
                        reply =>
                            reply.thread_id
                    )
                    .filter(
                        id => id
                    )
            )
        ];


    // ------------------------------------
    // スレッドIDがない場合
    // ------------------------------------

    if (threadIds.length === 0) {

        myReplies.innerHTML = `

            <div class="no-threads">

                <p>
                    返信元のスレッドが見つかりません。
                </p>

            </div>

        `;

        return;

    }


    // ------------------------------------
    // スレッド取得
    // ------------------------------------

    const {
        data: threads,
        error: threadsError
    } =
        await window.supabaseClient

            .from("threads")

            .select(
                "id, title"
            )

            .in(
                "id",
                threadIds
            );


    // ------------------------------------
    // スレッド取得エラー
    // ------------------------------------

    if (threadsError) {

        console.error(
            "返信元スレッド取得エラー:",
            threadsError
        );


        myReplies.innerHTML = `

            <p>
                返信を取得できませんでした。
            </p>

        `;

        return;

    }


    // ------------------------------------
    // スレッドをMap化
    // ------------------------------------

    const threadMap =
        new Map();


    (threads || []).forEach(
        function (thread) {

            threadMap.set(
                thread.id,
                thread
            );

        }
    );


    myReplies.innerHTML = "";


    // ------------------------------------
    // 表示
    // ------------------------------------

    replies.forEach(
        function (reply) {

            const thread =
                threadMap.get(
                    reply.thread_id
                );


            if (!thread) {
                return;
            }


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "profile-reply";


            article.innerHTML = `

                <a
                    href="thread.html?id=${encodeURIComponent(thread.id)}"
                    class="profile-reply-link"
                >

                    <div
                        class="profile-reply-thread"
                    >

                        ${escapeHTML(
                            thread.title
                        )}

                    </div>


                    <p>

                        ${escapeHTML(
                            reply.content
                        )}

                    </p>


                    <div
                        class="profile-reply-date"
                    >

                        ${formatDate(
                            reply.created_at
                        )}

                    </div>

                </a>

            `;


            myReplies.appendChild(
                article
            );

        }
    );

}


// ========================================
// 通報フォーム表示
// ========================================

function showReportForm(
    reportedUserId,
    reportedUsername
) {

    // ------------------------------------
    // 既存フォーム削除
    // ------------------------------------

    const existing =
        document.getElementById(
            "report-modal"
        );


    if (existing) {

        existing.remove();

    }


    // ------------------------------------
    // モーダル作成
    // ------------------------------------

    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "report-modal";


    modal.className =
        "report-modal";


    modal.innerHTML = `

        <div class="report-modal-overlay">

            <div class="report-modal-content">

                <h2>
                    ユーザーを通報
                </h2>


                <p>
                    「${escapeHTML(
                        reportedUsername
                    )}」を通報します。
                </p>


                <div class="report-form-group">

                    <label
                        for="report-reason"
                    >
                        通報理由
                    </label>


                    <select
                        id="report-reason"
                    >

                        <option value="">
                            選択してください
                        </option>

                        <option value="スパム・宣伝">
                            スパム・宣伝
                        </option>

                        <option value="嫌がらせ・迷惑行為">
                            嫌がらせ・迷惑行為
                        </option>

                        <option value="誹謗中傷">
                            誹謗中傷
                        </option>

                        <option value="不適切な投稿">
                            不適切な投稿
                        </option>

                        <option value="なりすまし">
                            なりすまし
                        </option>

                        <option value="その他">
                            その他
                        </option>

                    </select>

                </div>


                <div class="report-form-group">

                    <label
                        for="report-detail"
                    >
                        詳細
                    </label>


                    <textarea
                        id="report-detail"
                        rows="6"
                        maxlength="1000"
                        placeholder="問題の内容を具体的に入力してください。"
                    ></textarea>

                </div>


                <p
                    id="report-message"
                    class="report-message"
                ></p>


                <div class="report-actions">

                    <button
                        type="button"
                        id="cancel-report-button"
                    >
                        キャンセル
                    </button>


                    <button
                        type="button"
                        id="submit-report-button"
                    >
                        通報する
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // ------------------------------------
    // キャンセル
    // ------------------------------------

    const cancelButton =
        document.getElementById(
            "cancel-report-button"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                modal.remove();

            }
        );

    }


    // ------------------------------------
    // オーバーレイクリックで閉じる
    // ------------------------------------

    const overlay =
        modal.querySelector(
            ".report-modal-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    overlay
                ) {

                    modal.remove();

                }

            }
        );

    }


    // ------------------------------------
    // 通報送信
    // ------------------------------------

    const submitButton =
        document.getElementById(
            "submit-report-button"
        );


    if (submitButton) {

        submitButton.addEventListener(
            "click",
            function () {

                submitReport(
                    reportedUserId,
                    modal
                );

            }
        );

    }

}


// ========================================
// 通報送信
// ========================================

async function submitReport(
    reportedUserId,
    modal
) {

    const reasonElement =
        document.getElementById(
            "report-reason"
        );


    const detailElement =
        document.getElementById(
            "report-detail"
        );


    const message =
        document.getElementById(
            "report-message"
        );


    const submitButton =
        document.getElementById(
            "submit-report-button"
        );


    if (
        !reasonElement ||
        !detailElement ||
        !message ||
        !submitButton
    ) {

        return;

    }


    const reason =
        reasonElement.value;


    const detail =
        detailElement.value.trim();


    // ------------------------------------
    // 理由チェック
    // ------------------------------------

    if (!reason) {

        message.textContent =
            "通報理由を選択してください。";

        return;

    }


    // ------------------------------------
    // 詳細チェック
    // ------------------------------------

    if (!detail) {

        message.textContent =
            "詳細を入力してください。";

        return;

    }


    if (detail.length > 1000) {

        message.textContent =
            "詳細は1000文字以内にしてください。";

        return;

    }


    // ------------------------------------
    // ログインユーザー取得
    // ------------------------------------

    const {
        data: {
            user
        },
        error: userError
    } =
        await window.supabaseClient
            .auth
            .getUser();


    if (
        userError ||
        !user
    ) {

        message.textContent =
            "通報するにはログインが必要です。";

        return;

    }


    // ------------------------------------
    // 自分自身への通報防止
    // ------------------------------------

    if (
        user.id ===
        reportedUserId
    ) {

        message.textContent =
            "自分自身を通報することはできません。";

        return;

    }


    // ------------------------------------
    // 送信中
    // ------------------------------------

    submitButton.disabled =
        true;


    message.textContent =
        "通報を送信しています...";


    // ------------------------------------
    // Supabaseへ保存
    // ------------------------------------

    const {
        data,
        error
    } =
        await window.supabaseClient

            .from("reports")

            .insert({

                reporter_id:
                    user.id,

                reported_user_id:
                    reportedUserId,

                reason:
                    reason,

                detail:
                    detail,

                status:
                    "pending"

            })

            .select()

            .single();


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "通報送信エラー:",
            error
        );


        submitButton.disabled =
            false;


        message.textContent =
            "通報を送信できませんでした。";

        return;

    }


    // ------------------------------------
    // 成功
    // ------------------------------------

    console.log(
        "通報送信成功:",
        data
    );


    message.textContent =
        "通報を送信しました。";


    submitButton.disabled =
        true;


    // ------------------------------------
    // 少し待って閉じる
    // ------------------------------------

    setTimeout(
        function () {

            modal.remove();

        },
        1200
    );

}


// ========================================
// 表示名保存
// ========================================

if (usernameSaveButton) {

    usernameSaveButton.addEventListener(
        "click",
        async function () {

            // --------------------------------
            // 入力値取得
            // --------------------------------

            const username =
                usernameInput
                    ? usernameInput.value.trim()
                    : "";


            // --------------------------------
            // 入力チェック
            // --------------------------------

            if (!username) {

                if (usernameMessage) {

                    usernameMessage.textContent =
                        "表示名を入力してください。";

                }

                return;

            }


            if (username.length > 20) {

                if (usernameMessage) {

                    usernameMessage.textContent =
                        "表示名は20文字以内にしてください。";

                }

                return;

            }


            if (usernameMessage) {

                usernameMessage.textContent =
                    "保存しています...";

            }


            // --------------------------------
            // ログインユーザー取得
            // --------------------------------

            const {
                data: {
                    user
                },
                error
            } =
                await window.supabaseClient
                    .auth
                    .getUser();


            if (
                error ||
                !user
            ) {

                if (usernameMessage) {

                    usernameMessage.textContent =
                        "ログインしてください。";

                }

                return;

            }


            // --------------------------------
            // プロフィール保存
            // --------------------------------

            const {
                error: saveError
            } =
                await window.supabaseClient

                    .from("profiles")

                    .upsert({

                        id:
                            user.id,

                        username:
                            username

                    });


            // --------------------------------
            // 保存エラー
            // --------------------------------

            if (saveError) {

                console.error(
                    "プロフィール保存エラー:",
                    saveError
                );


                if (usernameMessage) {

                    usernameMessage.textContent =
                        "プロフィールを保存できませんでした。";

                }

                return;

            }


            // --------------------------------
            // 成功
            // --------------------------------

            if (usernameMessage) {

                usernameMessage.textContent =
                    "表示名を保存しました。";

            }


            // --------------------------------
            // プロフィール再読み込み
            // --------------------------------

            await loadProfile();

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
// 日付
// ========================================

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


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


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