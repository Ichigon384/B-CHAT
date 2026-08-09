// ========================================
// B-CHAT
// ログイン
// ========================================


// ----------------------------------------
// ログインフォーム
// ----------------------------------------

const loginForm =
    document.getElementById("login-form");


const loginMessage =
    document.getElementById("login-message");


// ----------------------------------------
// ログイン処理
// ----------------------------------------

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;


        loginMessage.textContent =
            "ログインしています...";


        const {
            data,
            error
        } = await window.supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


        // ------------------------------------
        // エラー
        // ------------------------------------

        if (error) {

            console.error(
                "ログインエラー:",
                error
            );


            loginMessage.textContent =
                "メールアドレスまたはパスワードが正しくありません。";

            return;
        }


        // ------------------------------------
        // ログイン成功
        // ------------------------------------

        console.log(
            "ログイン成功:",
            data
        );


        // ホームへ移動

        window.location.href =
            "index.html";

    }
);
