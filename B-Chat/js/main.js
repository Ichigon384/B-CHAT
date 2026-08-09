// ========================================
// B-CHAT
// 共通処理
// ========================================


// ----------------------------------------
// Supabase
// ----------------------------------------

const SUPABASE_URL =
    "https://wzmlzqxdtztejdflakio.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_sE2rAdafCAy4nZDFgcfKXA_wHhEb5kx";


window.supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ----------------------------------------
// ログイン状態を確認
// ----------------------------------------

async function checkAuth() {

    const authLink =
        document.getElementById("auth-link");


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
    } = await window.supabaseClient.auth.getSession();


    // エラー
    if (error) {

        console.error(
            "セッション取得エラー:",
            error
        );

        return;
    }


    const session = data.session;


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

    const user = session.user;


    authLink.innerHTML = `

        <span class="user-email">
            ${user.email}
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
        document.getElementById("logout-button");


    logoutButton.addEventListener(
        "click",
        async function() {

            const {
                error
            } = await window.supabaseClient.auth.signOut();


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


// ----------------------------------------
// 実行
// ----------------------------------------

checkAuth();
