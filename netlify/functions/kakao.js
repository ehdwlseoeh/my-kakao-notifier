const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message } = JSON.parse(event.body);
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    const KAKAO_AUTH_CODE = process.env.KAKAO_AUTH_CODE; // 최초 1회만 사용
    const REDIRECT_URI = process.env.REDIRECT_URI;

    // 실제로는 이 토큰을 DB나 다른 곳에 저장하고 갱신해야 하지만,
    // 여기서는 간단하게 매번 받는 것으로 구현합니다.
    // 실제 서비스에서는 이 코드를 그대로 사용하면 안 됩니다.
    // 이 방법은 토큰 만료 시 수동으로 코드를 다시 받아야 합니다.

    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code: KAKAO_AUTH_CODE,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    const accessToken = tokenData.access_token;

    const messageResponse = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify({
          object_type: 'text',
          text: message,
          link: {
            web_url: 'https://ticket.melon.com',
            mobile_web_url: 'https://ticket.melon.com',
          },
          button_title: '티켓 확인하기',
        }),
      }),
    });

    const messageData = await messageResponse.json();
    if (messageData.code) throw new Error(JSON.stringify(messageData));

    return {
      statusCode: 200,
      body: JSON.stringify({ result: 'Message sent successfully' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
