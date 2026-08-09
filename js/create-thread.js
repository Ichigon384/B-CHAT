// ========================================
// B-CHAT
// スレッド作成
// ========================================


// ----------------------------------------
// フォーム
// ----------------------------------------

const createThreadForm =
    document.getElementById(
        "create-thread-form"
    );


const createThreadMessage =
    document.getElementById(
        "create-thread-message"
    );


const imageInput =
    document.getElementById(
        "thread-image"
    );


const imagePreview =
    document.getElementById(
        "image-preview"
    );


// ----------------------------------------
// 許可する画像
// ----------------------------------------

const allowedImageTypes = [

    "image/jpeg",

    "image/png",

    "image/webp"

];


const maxImageSize =
    10 * 1024 * 1024;


// ----------------------------------------
// 画像プレビュー
// ----------------------------------------

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function() {

            const file =
                imageInput.files[0];


            imagePreview.innerHTML = "";


            if (!file) {

                return;

            }


            // ----------------------------
            // サイズ確認
            // ----------------------------

            if (
                file.size >
                maxImageSize
            ) {

                imagePreview.innerHTML = `

                    <p>
                        画像は10MB以下にしてください。
                    </p>

                `;


                imageInput.value = "";


                return;

            }


            // ----------------------------
            // MIMEタイプ確認
            // ----------------------------

            if (
                !allowedImageTypes.includes(
                    file.type
                )
            ) {

                imagePreview.innerHTML = `

                    <p>
                        JPG・PNG・WEBPのみ使用できます。
                    </p>

                `;


                imageInput.value = "";


                return;

            }


            // ----------------------------
            // プレビュー
            // ----------------------------

            const reader =
                new FileReader();


            reader.onload =
                function(event) {

                    imagePreview.innerHTML = `

                        <img
                            src="${event.target.result}"
                            alt="画像プレビュー"
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


// ----------------------------------------
// フォーム送信
// ----------------------------------------

if (createThreadForm) {

    createThreadForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            // --------------------------------
            // 入力値
            // --------------------------------

            const category =
                document.getElementById(
                    "category"
                ).value;


            const title =
                document.getElementById(
                    "title"
                ).value.trim();


            const content =
                document.getElementById(
                    "content"
                ).value.trim();


            const imageFile =
                imageInput &&
                imageInput.files[0]
                    ? imageInput.files[0]
                    : null;


            createThreadMessage.textContent =
                "スレッドを作成しています...";


            // --------------------------------
            // ログインユーザー
            // --------------------------------

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

                createThreadMessage.textContent =
                    "スレッドを作成するにはログインが必要です。";

                return;

            }


            // --------------------------------
            // 表示名取得
            // --------------------------------

            createThreadMessage.textContent =
                "ユーザー情報を確認しています...";


            const {
                data: profile,
                error: profileError
            } =
                await window.supabaseClient

                    .from("profiles")

                    .select("username")

                    .eq(
                        "id",
                        user.id
                    )

                    .maybeSingle();


            // --------------------------------
            // プロフィール取得エラー
            // --------------------------------

            if (profileError) {

                console.error(
                    "プロフィール取得エラー:",
                    profileError
                );


                createThreadMessage.textContent =
                    "ユーザー情報を取得できませんでした。";

                return;

            }


            // --------------------------------
            // 表示名
            // --------------------------------
            //
            // 表示名が設定されていない場合は
            // メールアドレスを使用
            //

            const username =
                profile?.username ||
                user.email;


            // --------------------------------
            // 画像チェック
            // --------------------------------

            if (imageFile) {

                if (
                    imageFile.size >
                    maxImageSize
                ) {

                    createThreadMessage.textContent =
                        "画像は10MB以下にしてください。";

                    return;

                }


                if (
                    !allowedImageTypes.includes(
                        imageFile.type
                    )
                ) {

                    createThreadMessage.textContent =
                        "JPG・PNG・WEBPのみ使用できます。";

                    return;

                }

            }


            // --------------------------------
            // 画像URL
            // --------------------------------

            let imageUrl = null;


            // --------------------------------
            // 画像アップロード
            // --------------------------------

            if (imageFile) {

                createThreadMessage.textContent =
                    "画像をアップロードしています...";


                // ----------------------------
                // 拡張子取得
                // ----------------------------

                const extension =
                    imageFile.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                // ----------------------------
                // 安全なファイル名
                // ----------------------------

                const fileName =
                    `${crypto.randomUUID()}.${extension}`;


                // ----------------------------
                // 保存先
                // ----------------------------

                const filePath =
                    `${user.id}/${fileName}`;


                // ----------------------------
                // アップロード
                // ----------------------------

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
                            imageFile,
                            {

                                contentType:
                                    imageFile.type,

                                upsert:
                                    false

                            }
                        );


                // ----------------------------
                // アップロードエラー
                // ----------------------------

                if (uploadError) {

                    console.error(
                        "画像アップロードエラー:",
                        uploadError
                    );


                    createThreadMessage.textContent =
                        "画像をアップロードできませんでした。";

                    return;

                }


                // ----------------------------
                // 公開URL取得
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


                imageUrl =
                    publicUrlData.publicUrl;

            }


            // --------------------------------
            // threadsに登録
            // --------------------------------

            createThreadMessage.textContent =
                "スレッドを保存しています...";


            const {
                data,
                error
            } =
                await window.supabaseClient

                    .from("threads")

                    .insert({

                        title:
                            title,

                        content:
                            content,

                        category:
                            category,

                        username:
                            username,

                        user_id:
                            user.id,

                        image_url:
                            imageUrl

                    })

                    .select()

                    .single();


            // --------------------------------
            // スレッド保存エラー
            // --------------------------------

            if (error) {

                console.error(
                    "スレッド作成エラー:",
                    error
                );


                createThreadMessage.textContent =
                    "スレッドを作成できませんでした。";

                return;

            }


            // --------------------------------
            // 成功
            // --------------------------------

            console.log(
                "スレッド作成成功:",
                data
            );


            // --------------------------------
            // スレッド詳細へ移動
            // --------------------------------

            window.location.href =
                `thread.html?id=${data.id}`;

        }
    );

}
