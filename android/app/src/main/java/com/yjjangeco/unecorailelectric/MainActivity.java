package com.yjjangeco.unecorailelectric;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleWidgetIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetIntent(intent);
    }

    /**
     * 위젯에서 넘어온 이동 정보(route/date/action)를 웹으로 전달한다.
     * - 콜드 스타트: Capacitor Preferences("CapacitorStorage" → "widget_nav")에 저장 →
     *   웹이 시작 시 읽어 이동
     * - 이미 실행 중: 'widgetNavigate' 커스텀 이벤트로 즉시 알림
     */
    private void handleWidgetIntent(Intent intent) {
        if (intent == null) return;
        String route = intent.getStringExtra("route");
        if (route == null) return;

        String date = intent.getStringExtra("date");
        String action = intent.getStringExtra("action");

        try {
            JSONObject nav = new JSONObject();
            nav.put("route", route);
            if (date != null) nav.put("date", date);
            if (action != null) nav.put("action", action);
            nav.put("ts", System.currentTimeMillis());
            final String payload = nav.toString();

            SharedPreferences sp = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            sp.edit().putString("widget_nav", payload).apply();

            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() ->
                        getBridge().getWebView().evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('widgetNavigate',{detail:" + payload + "}));",
                                null));
            }
        } catch (Exception ignored) {
        }

        // 처리한 extra 제거 (재진입 시 중복 이동 방지)
        intent.removeExtra("route");
        intent.removeExtra("date");
        intent.removeExtra("action");
    }
}
