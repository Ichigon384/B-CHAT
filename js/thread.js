// ========================================
// B-CHAT
// スレッド詳細ページ
// ========================================


// ----------------------------------------
// URLからスレッドIDを取得
// ----------------------------------------

const params =
    new URLSearchParams(
        window.location.search
    );

const threadId =
    params.get("id");


// ----------------------------------------
// 現在のユーザー
// ----------------------------------------

let currentUser = null;


// ----------------------------------------
// 現在のユーザー名
// ----------------------------------------

let currentUsername = null;


// ----------------------------------------
// スレッド取得
// ----------------------------------------

async function loadThread() {

    const threadDetail =
        document.getElementById(
            "thread-detail"
        );


    if (!threadDetail) {

        console.error(
            "thread-detailが見つかりません。"
        );

        return;
    }


    if (!threadId) {

        threadDetail.innerHTML = `
            <p>
                スレッドが指定されていません。
            </p>
        `;

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


    if (userError) {

        console.error(
            "ユーザー情報取得エラー:",
            userError
        );

    }


    currentUser =
        user || null;


    // ------------------------------------
    // ユーザー名取得
    // ------------------------------------

    if (currentUser) {

        const {
            data: profile,
            error: profileError
        } =
            await window.supabaseClient

                .from("profiles")

                .select("username")

                .eq(
                    "id",
                    currentUser.id
                )

                .maybeSingle();


        if (profileError) {

            console.error(
                "プロフィール取得エラー:",
                profileError
            );

        }


        currentUsername =
            profile?.username ||
            currentUser.email;

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
                "id",
                threadId
            )

            .single();


    if (error) {

        console.error(
            "スレッド取得エラー:",
            error
        );


        threadDetail.innerHTML = `
            <p>
                スレッドを取得できませんでした。
            </p>
        `;

        return;
    }


    // ------------------------------------
    // 自分のスレッドか確認
    // ------------------------------------

    const isOwner =
        currentUser &&
        currentUser.id === data.user_id;


    // ------------------------------------
    // 編集・削除ボタン
    // ------------------------------------

    let ownerButtons = "";


    if (isOwner) {

        ownerButtons = `

            <div class="thread-owner-actions">

                <button
                    id="edit-thread-button"
                    type="button"
                >
                    編集
                </button>


                <button
                    id="delete-thread-button"
                    type="button"
                >
                    削除
                </button>

            </div>

        `;

    }


    // ------------------------------------
    // スレッド表示
    // ------------------------------------

    threadDetail.innerHTML = `

        <article class="thread-detail">

            <div class="thread-category">

                #${escapeHTML(
                    data.category
                )}

            </div>


            <h1>

                ${escapeHTML(
                    data.title
                )}

            </h1>


            <div class="thread-meta">

                <span>

                    ${escapeHTML(
                        data.username
                    )}

                </span>


                <span>

                    ${formatDate(
                        data.created_at
                    )}

                </span>

            </div>


            <div class="thread-content">

                <p>

                    ${escapeHTML(
                        data.content
                    )}

                </p>


                ${
                    data.image_url
                    ? `

                        <div class="thread-image">

                            <img
                                src="${escapeHTML(
                                    data.image_url
                                )}"
                                alt="スレッド添付画像"
                            >

                        </div>

                    `
                    : ""
                }

            </div>


            ${ownerButtons}

        </article>

    `;


    // ------------------------------------
    // 編集ボタン
    // ------------------------------------

    const editButton =
        document.getElementById(
            "edit-thread-button"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            function() {

                showEditForm(data);

            }
        );

    }


    // ------------------------------------
    // 削除ボタン
    // ------------------------------------

    const deleteButton =
        document.getElementById(
            "delete-thread-button"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            function() {

                deleteThread();

            }
        );

    }


    // ------------------------------------
    // 返信
    // ------------------------------------

    await loadReplies();

    await setupReplyForm();

}


// ----------------------------------------
// 編集フォーム
// ----------------------------------------

function showEditForm(thread) {

    const threadDetail =
        document.getElementById(
            "thread-detail"
        );


    threadDetail.innerHTML = `

        <div class="edit-thread-box">

            <h2>
                スレッドを編集
            </h2>


            <div class="form-group">

                <label>
                    タイトル
                </label>

                <input
                    type="text"
                    id="edit-title"
                    value="${escapeHTML(
                        thread.title
                    )}"
                    maxlength="100"
                >

            </div>


            <div class="form-group">

                <label>
                    本文
                </label>

                <textarea
                    id="edit-content"
                    rows="10"
                >${escapeHTML(
                    thread.content
                )}</textarea>

            </div>


            <div class="edit-actions">

                <button
                    id="save-edit-button"
                    type="button"
                >
                    保存
                </button>


                <button
                    id="cancel-edit-button"
                    type="button"
                >
                    キャンセル
                </button>

            </div>


            <p id="edit-message"></p>

        </div>

    `;


    // ------------------------------------
    // 保存
    // ------------------------------------

    document
        .getElementById(
            "save-edit-button"
        )
        .addEventListener(
            "click",
            function() {

                saveEdit(
                    thread
                );

            }
        );


    // ------------------------------------
    // キャンセル
    // ------------------------------------

    document
        .getElementById(
            "cancel-edit-button"
        )
        .addEventListener(
            "click",
            function() {

                loadThread();

            }
        );

}


// ----------------------------------------
// 編集保存
// ----------------------------------------

async function saveEdit(thread) {

    const title =
        document
            .getElementById(
                "edit-title"
            )
            .value
            .trim();


    const content =
        document
            .getElementById(
                "edit-content"
            )
            .value
            .trim();


    const message =
        document
            .getElementById(
                "edit-message"
            );


    if (!title || !content) {

        message.textContent =
            "タイトルと本文を入力してください。";

        return;
    }


    message.textContent =
        "保存しています...";


    // ------------------------------------
    // 更新
    // ------------------------------------

    const {
        data,
        error
    } =
        await window.supabaseClient

            .from("threads")

            .update({

                title:
                    title,

                content:
                    content

            })

            .eq(
                "id",
                thread.id
            )

            .select()

            .single();


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "スレッド更新エラー:",
            error
        );


        message.textContent =
            "スレッドを更新できませんでした。";

        return;
    }


    console.log(
        "スレッド更新成功:",
        data
    );


    // ------------------------------------
    // 再表示
    // ------------------------------------

    await loadThread();

}


// ----------------------------------------
// スレッド削除
// ----------------------------------------

async function deleteThread() {

    const confirmed =
        window.confirm(
            "このスレッドを削除しますか？\n\n削除すると元に戻せません。"
        );


    if (!confirmed) {

        return;

    }


    // ------------------------------------
    // 削除
    // ------------------------------------

    const {
        error
    } =
        await window.supabaseClient

            .from("threads")

            .delete()

            .eq(
                "id",
                threadId
            );


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "スレッド削除エラー:",
            error
        );


        alert(
            "スレッドを削除できませんでした。"
        );

        return;
    }


    // ------------------------------------
    // 成功
    // ------------------------------------

    alert(
        "スレッドを削除しました。"
    );


    window.location.href =
        "threads.html";

}


// ----------------------------------------
// 返信取得
// ----------------------------------------

async function loadReplies() {

    const replyList =
        document.getElementById(
            "reply-list"
        );


    if (!replyList) {

        return;

    }


    const {
        data,
        error
    } =
        await window.supabaseClient

            .from("replies")

            .select("*")

            .eq(
                "thread_id",
                threadId
            )

            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "返信取得エラー:",
            error
        );


        replyList.innerHTML = `
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
        !data ||
        data.length === 0
    ) {

        replyList.innerHTML = `
            <p>
                まだ返信はありません。
            </p>
        `;

        return;
    }


    replyList.innerHTML = "";


    // ------------------------------------
    // 返信表示
    // ------------------------------------

    data.forEach(
        (reply, index) => {

            const replyElement =
                document.createElement(
                    "article"
                );


            replyElement.className =
                "reply";


            // ----------------------------
            // 自分の返信か
            // ----------------------------

            const isOwner =
                currentUser &&
                currentUser.id ===
                    reply.user_id;


            // ----------------------------
            // 編集・削除ボタン
            // ----------------------------

            let replyActions = "";


            if (isOwner) {

                replyActions = `

                    <div class="reply-owner-actions">

                        <button
                            class="edit-reply-button"
                            data-id="${reply.id}"
                        >
                            編集
                        </button>


                        <button
                            class="delete-reply-button"
                            data-id="${reply.id}"
                        >
                            削除
                        </button>

                    </div>

                `;

            }


            // ----------------------------
            // HTML
            // ----------------------------

            replyElement.innerHTML = `

                <div class="reply-header">

                    <span class="reply-number">

                        #${index + 1}

                    </span>


                    <span class="reply-user">

                        ${escapeHTML(
                            reply.username
                        )}

                    </span>


                    <span class="reply-date">

                        ${formatDate(
                            reply.created_at
                        )}

                    </span>

                </div>


                <div
                    class="reply-body"
                    id="reply-body-${reply.id}"
                >

                    <div class="reply-content">

                        <p>

                            ${escapeHTML(
                                reply.content
                            )}

                        </p>


                        ${
                            reply.image_url
                            ? `

                                <div class="reply-image">

                                    <img
                                        src="${escapeHTML(
                                            reply.image_url
                                        )}"
                                        alt="返信添付画像"
                                    >

                                </div>

                            `
                            : ""
                        }

                    </div>


                    ${replyActions}

                </div>

            `;


            replyList.appendChild(
                replyElement
            );

        }
    );


    // ------------------------------------
    // 編集ボタン
    // ------------------------------------

    const editButtons =
        replyList.querySelectorAll(
            ".edit-reply-button"
        );


    editButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                function() {

                    const replyId =
                        Number(
                            button.dataset.id
                        );


                    const reply =
                        data.find(
                            item =>
                                item.id ===
                                replyId
                        );


                    if (reply) {

                        showReplyEditForm(
                            reply
                        );

                    }

                }
            );

        }
    );


    // ------------------------------------
    // 削除ボタン
    // ------------------------------------

    const deleteButtons =
        replyList.querySelectorAll(
            ".delete-reply-button"
        );


    deleteButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                function() {

                    const replyId =
                        Number(
                            button.dataset.id
                        );


                    deleteReply(
                        replyId
                    );

                }
            );

        }
    );

}


// ----------------------------------------
// 返信フォーム
// ----------------------------------------

async function setupReplyForm() {

    const replyFormArea =
        document.getElementById(
            "reply-form-area"
        );


    const replyForm =
        document.getElementById(
            "reply-form"
        );


    const replyImageInput =
        document.getElementById(
            "reply-image"
        );


    const replyImagePreview =
        document.getElementById(
            "reply-image-preview"
        );


    // ------------------------------------
    // 画像プレビュー
    // ------------------------------------

    if (
        replyImageInput &&
        replyImagePreview
    ) {

        replyImageInput.addEventListener(
            "change",
            function() {

                const file =
                    replyImageInput.files[0];


                replyImagePreview.innerHTML =
                    "";


                if (!file) {

                    return;

                }


                // ------------------------
                // サイズ
                // ------------------------

                if (
                    file.size >
                    10 * 1024 * 1024
                ) {

                    replyImagePreview.innerHTML = `

                        <p>
                            画像は10MB以下にしてください。
                        </p>

                    `;


                    replyImageInput.value =
                        "";


                    return;

                }


                // ------------------------
                // MIMEタイプ
                // ------------------------

                const allowedTypes = [

                    "image/jpeg",

                    "image/png",

                    "image/webp"

                ];


                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {

                    replyImagePreview.innerHTML = `

                        <p>
                            JPG・PNG・WEBPのみ使用できます。
                        </p>

                    `;


                    replyImageInput.value =
                        "";


                    return;

                }


                // ------------------------
                // プレビュー
                // ------------------------

                const reader =
                    new FileReader();


                reader.onload =
                    function(event) {

                        replyImagePreview.innerHTML = `

                            <img
                                src="${event.target.result}"
                                alt="返信画像プレビュー"
                                style="
                                    max-width: 300px;
                                    max-height: 300px;
                                    object-fit: contain;
                                "
                            >

                        `;

                    };


                reader.readAsDataURL(
                    file
                );

            }
        );

    }


    // ------------------------------------
    // フォーム確認
    // ------------------------------------

    if (
        !replyFormArea ||
        !replyForm
    ) {

        return;

    }


    // ------------------------------------
    // 未ログイン
    // ------------------------------------

    if (!currentUser) {

        replyFormArea.innerHTML = `

            <div class="reply-login-message">

                <p>
                    返信するにはログインが必要です。
                </p>


                <a href="login.html">
                    ログイン
                </a>

            </div>

        `;

        return;

    }


    // ------------------------------------
    // 返信送信
    // ------------------------------------

    replyForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const replyContent =
                document
                    .getElementById(
                        "reply-content"
                    )
                    .value
                    .trim();


            const replyImageInput =
                document.getElementById(
                    "reply-image"
                );


            const replyImage =
                replyImageInput &&
                replyImageInput.files[0]
                    ? replyImageInput.files[0]
                    : null;


            const replyMessage =
                document
                    .getElementById(
                        "reply-message"
                    );


            if (!replyContent) {

                replyMessage.textContent =
                    "返信内容を入力してください。";

                return;

            }


            // --------------------------------
            // 画像チェック
            // --------------------------------

            if (replyImage) {

                if (
                    replyImage.size >
                    10 * 1024 * 1024
                ) {

                    replyMessage.textContent =
                        "画像は10MB以下にしてください。";

                    return;

                }


                const allowedTypes = [

                    "image/jpeg",

                    "image/png",

                    "image/webp"

                ];


                if (
                    !allowedTypes.includes(
                        replyImage.type
                    )
                ) {

                    replyMessage.textContent =
                        "JPG・PNG・WEBPのみ使用できます。";

                    return;

                }

            }


            replyMessage.textContent =
                "返信を投稿しています...";


            // --------------------------------
            // 最新の表示名を取得
            // --------------------------------

            const {
                data: profile,
                error: profileError
            } =
                await window.supabaseClient

                    .from("profiles")

                    .select("username")

                    .eq(
                        "id",
                        currentUser.id
                    )

                    .maybeSingle();


            if (profileError) {

                console.error(
                    "プロフィール取得エラー:",
                    profileError
                );

            }


            const username =
                profile?.username ||
                currentUser.email;


            // --------------------------------
            // 画像URL
            // --------------------------------

            let replyImageUrl = null;


            // --------------------------------
            // 画像アップロード
            // --------------------------------

            if (replyImage) {

                replyMessage.textContent =
                    "画像をアップロードしています...";


                const extension =
                    replyImage.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                const fileName =
                    `${crypto.randomUUID()}.${extension}`;


                const filePath =
                    `${currentUser.id}/reply-${fileName}`;


                const {
                    error: uploadError
                } =
                    await window.supabaseClient

                        .storage

                        .from(
                            "thread-images"
                        )

                        .upload(
                            filePath,
                            replyImage,
                            {

                                contentType:
                                    replyImage.type,

                                upsert:
                                    false

                            }
                        );


                if (uploadError) {

                    console.error(
                        "返信画像アップロードエラー:",
                        uploadError
                    );


                    replyMessage.textContent =
                        "画像をアップロードできませんでした。";

                    return;

                }


                // ----------------------------
                // 公開URL
                // ----------------------------

                const {
                    data: publicUrlData
                } =
                    window.supabaseClient

                        .storage

                        .from(
                            "thread-images"
                        )

                        .getPublicUrl(
                            filePath
                        );


                replyImageUrl =
                    publicUrlData.publicUrl;

            }


            // --------------------------------
            // repliesに登録
            // --------------------------------

            replyMessage.textContent =
                "返信を保存しています...";


            const {
                data,
                error
            } =
                await window.supabaseClient

                    .from("replies")

                    .insert({

                        thread_id:
                            Number(threadId),

                        content:
                            replyContent,

                        username:
                            username,

                        user_id:
                            currentUser.id,

                        image_url:
                            replyImageUrl

                    })

                    .select()

                    .single();


            // --------------------------------
            // エラー
            // --------------------------------

            if (error) {

                console.error(
                    "返信投稿エラー:",
                    error
                );


                replyMessage.textContent =
                    "返信を投稿できませんでした。";

                return;

            }


            console.log(
                "返信投稿成功:",
                data
            );


            // --------------------------------
            // 入力欄クリア
            // --------------------------------

            document
                .getElementById(
                    "reply-content"
                )
                .value = "";


            if (replyImageInput) {

                replyImageInput.value =
                    "";

            }


            if (replyImagePreview) {

                replyImagePreview.innerHTML =
                    "";

            }


            replyMessage.textContent =
                "返信しました。";


            // --------------------------------
            // 返信再読み込み
            // --------------------------------

            await loadReplies();

        }
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
// 返信編集フォーム
// ----------------------------------------

function showReplyEditForm(
    reply
) {

    const replyBody =
        document.getElementById(
            `reply-body-${reply.id}`
        );


    if (!replyBody) {

        return;

    }


    replyBody.innerHTML = `

        <div class="reply-edit-box">

            <textarea
                id="edit-reply-${reply.id}"
                rows="5"
            >${escapeHTML(
                reply.content
            )}</textarea>


            <div class="reply-edit-actions">

                <button
                    id="save-reply-${reply.id}"
                    type="button"
                >
                    保存
                </button>


                <button
                    id="cancel-reply-${reply.id}"
                    type="button"
                >
                    キャンセル
                </button>

            </div>


            <p
                id="reply-edit-message-${reply.id}"
            ></p>

        </div>

    `;


    // ------------------------------------
    // 保存
    // ------------------------------------

    document
        .getElementById(
            `save-reply-${reply.id}`
        )
        .addEventListener(
            "click",
            function() {

                saveReplyEdit(
                    reply.id
                );

            }
        );


    // ------------------------------------
    // キャンセル
    // ------------------------------------

    document
        .getElementById(
            `cancel-reply-${reply.id}`
        )
        .addEventListener(
            "click",
            function() {

                loadReplies();

            }
        );

}


// ----------------------------------------
// 返信編集保存
// ----------------------------------------

async function saveReplyEdit(
    replyId
) {

    const textarea =
        document.getElementById(
            `edit-reply-${replyId}`
        );


    const message =
        document.getElementById(
            `reply-edit-message-${replyId}`
        );


    const content =
        textarea.value.trim();


    if (!content) {

        message.textContent =
            "返信内容を入力してください。";

        return;

    }


    message.textContent =
        "保存しています...";


    // ------------------------------------
    // 更新
    // ------------------------------------

    const {
        data,
        error
    } =
        await window.supabaseClient

            .from("replies")

            .update({

                content:
                    content

            })

            .eq(
                "id",
                replyId
            )

            .select()

            .single();


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "返信更新エラー:",
            error
        );


        message.textContent =
            "返信を更新できませんでした。";

        return;

    }


    console.log(
        "返信更新成功:",
        data
    );


    // ------------------------------------
    // 再表示
    // ------------------------------------

    await loadReplies();

}


// ----------------------------------------
// 返信削除
// ----------------------------------------

async function deleteReply(
    replyId
) {

    const confirmed =
        window.confirm(
            "この返信を削除しますか？\n\n削除すると元に戻せません。"
        );


    if (!confirmed) {

        return;

    }


    // ------------------------------------
    // 削除
    // ------------------------------------

    const {
        error
    } =
        await window.supabaseClient

            .from("replies")

            .delete()

            .eq(
                "id",
                replyId
            );


    // ------------------------------------
    // エラー
    // ------------------------------------

    if (error) {

        console.error(
            "返信削除エラー:",
            error
        );


        alert(
            "返信を削除できませんでした。"
        );

        return;

    }


    // ------------------------------------
    // 成功
    // ------------------------------------

    await loadReplies();

}


// ----------------------------------------
// 開始
// ----------------------------------------

loadThread();
