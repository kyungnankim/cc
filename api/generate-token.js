// /api/generate-token.js
// 이 파일은 클라이언트가 아닌, Vercel의 안전한 서버 환경에서 실행됩니다.

import jwt from "jsonwebtoken";

// 환경 변수에서 민감한 정보를 가져옵니다.
const TEAM_ID = process.env.VITE_APPLE_TEAM_ID;
const KEY_ID = process.env.VITE_APPLE_KEY_ID;
// 환경 변수에서 private key를 가져올 때, '\n' 문자를 실제 줄바꿈으로 변경합니다.
const PRIVATE_KEY = process.env.VITE_APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");

/**
 * @param {import('vercel/node').VercelRequest} req
 * @param {import('vercel/node').VercelResponse} res
 */
export default function handler(req, res) {
  // POST 요청 등 다른 HTTP 메소드를 차단하고 싶다면 아래 주석을 해제하세요.
  // if (req.method !== 'GET') {
  //   return res.status(405).json({ error: 'Method Not Allowed' });
  // }

  if (!TEAM_ID || !KEY_ID || !PRIVATE_KEY) {
    console.error("❌ 환경 변수가 설정되지 않았습니다.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const payload = {
      iss: TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24시간 유효
    };

    const header = {
      alg: "ES256",
      kid: KEY_ID,
    };

    const token = jwt.sign(payload, PRIVATE_KEY, {
      algorithm: "ES256",
      header: header,
    });

    // CORS 헤더 설정 (다른 도메인에서 요청 시 필요할 수 있습니다)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // 생성된 토큰을 JSON 형태로 응답합니다.
    return res.status(200).json({ token });
  } catch (error) {
    console.error("❌ Token 생성 실패:", error);
    return res.status(500).json({ error: "Token generation failed." });
  }
}
