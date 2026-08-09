// ========================================
// B-CHAT
// アカウント作成
// ========================================


// ----------------------------------------
// フォーム
// ----------------------------------------

const signupForm =
    document.getElementById("signup-form");


const signupMessage =
    document.getElementById("signup-message");


// ----------------------------------------
// 登録
// ----------------------------------------

signupForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;


        signupMessage.textContent =
            "アカウントを作成しています...";


        const {
            data,
            error
        } = await window.supabaseClient.auth.signUp({

            email: email,

            password: password

        });


        // ------------------------------------
        // エラー
        // ------------------------------------

        if (error) {

            console.error(
                "登録エラー:",
                error
            );


            signupMessage.textContent =
                error.message;

            return;
        }


        // ------------------------------------
        // 登録成功
        // ------------------------------------

        console.log(
            "登録成功:",
            data
        );


        signupMessage.textContent =
            "登録しました。ログインしてください。";

    }
);
