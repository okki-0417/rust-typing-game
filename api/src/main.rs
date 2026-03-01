use std::net::SocketAddr;
use axum::{
    Json, Router, http::StatusCode, routing::{get, post}, response::IntoResponse
};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct TypeInput {
    word: String,
    time_taken: f32
}


#[derive(Serialize)]
struct GameStatus {
    message: String,
    enemy_hp: i32,
    current_word: String,
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/status", get(get_status))
        .route("/submit", post(submit))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Listening on {}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn get_status() -> Json<GameStatus> {
    println!("ステータス要求を受信");

    let status = GameStatus {
        message: "Battle Start".to_string(),
        enemy_hp: 100,
        current_word: "rust_is_fast".to_string(),
    };

    Json(status)
}

async fn submit(Json(input): Json<TypeInput>) -> impl IntoResponse {
    println!("入力を受信: {}", input.word);

    println!("受信: {} を {} 秒で", input.word, input.time_taken);

    StatusCode::OK
}
