package com.yjjangeco.unecorailelectric;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

public class MemoWidgetProvider extends AppWidgetProvider {

    private static final int SLOTS = 8;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            renderWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action)) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, MemoWidgetProvider.class));
            for (int id : ids) renderWidget(context, manager, id);
        }
    }

    private void renderWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_memo);
        Resources res = context.getResources();
        String pkg = context.getPackageName();

        JSONArray memos = loadMemos(context);
        int shown = Math.min(memos.length(), SLOTS);

        views.setViewVisibility(R.id.widget_memo_empty, memos.length() == 0 ? View.VISIBLE : View.GONE);

        for (int i = 0; i < SLOTS; i++) {
            int rootId = res.getIdentifier("memo_" + i + "_root", "id", pkg);
            int barId = res.getIdentifier("memo_" + i + "_bar", "id", pkg);
            int titleId = res.getIdentifier("memo_" + i + "_title", "id", pkg);
            int contentId = res.getIdentifier("memo_" + i + "_content", "id", pkg);

            if (i >= shown) {
                views.setViewVisibility(rootId, View.GONE);
                continue;
            }

            JSONObject memo = memos.optJSONObject(i);
            String title = memo != null ? memo.optString("title", "") : "";
            String content = memo != null ? memo.optString("content", "") : "";
            String color = memo != null ? memo.optString("color", "yellow") : "yellow";
            if (title.trim().isEmpty()) title = "(제목 없음)";

            views.setViewVisibility(rootId, View.VISIBLE);
            views.setTextViewText(titleId, title);
            views.setTextViewText(contentId, content);
            try {
                views.setInt(barId, "setBackgroundColor", Color.parseColor(colorHex(color)));
            } catch (Exception ignored) {
            }
        }

        // 항목 영역 탭 → 메모 화면
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setAction(Intent.ACTION_VIEW);
        openIntent.putExtra("route", "/memo");
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.setData(Uri.parse("uneco://memo/" + appWidgetId));
        PendingIntent openPending = PendingIntent.getActivity(
                context, 300 + appWidgetId, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_memo_root, openPending);

        // ＋ → 새 메모
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.putExtra("route", "/memo");
        addIntent.putExtra("action", "new");
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        addIntent.setData(Uri.parse("uneco://memoadd/" + appWidgetId));
        views.setOnClickPendingIntent(R.id.widget_memo_add_btn, PendingIntent.getActivity(
                context, 400 + appWidgetId, addIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private JSONArray loadMemos(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String json = sp.getString("widget_memos", null);
            if (json == null) return new JSONArray();
            JSONObject root = new JSONObject(json);
            JSONArray arr = root.optJSONArray("memos");
            return arr != null ? arr : new JSONArray();
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private String colorHex(String name) {
        if (name == null) return "#FACC15";
        switch (name.toLowerCase(Locale.ROOT)) {
            case "blue": return "#3B82F6";
            case "green": return "#22C55E";
            case "pink": return "#EC4899";
            case "purple": return "#8B5CF6";
            case "red": return "#EF4444";
            case "gray":
            case "grey": return "#9CA3AF";
            case "yellow":
            default: return "#FACC15";
        }
    }
}
