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

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class CalendarWidgetProvider extends AppWidgetProvider {

    private static final String PREFS = "uneco_widget";
    private static final String KEY_OFFSET = "cal_offset_";

    private static final String ACTION_PREV = "com.yjjangeco.unecorailelectric.CAL_PREV";
    private static final String ACTION_NEXT = "com.yjjangeco.unecorailelectric.CAL_NEXT";
    private static final String ACTION_TODAY = "com.yjjangeco.unecorailelectric.CAL_TODAY";

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
        if (action == null) return;

        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        if (Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, CalendarWidgetProvider.class));
            for (int id : ids) renderWidget(context, manager, id);
            return;
        }

        int appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return;

        if (ACTION_PREV.equals(action)) {
            setOffset(context, appWidgetId, getOffset(context, appWidgetId) - 1);
            renderWidget(context, manager, appWidgetId);
        } else if (ACTION_NEXT.equals(action)) {
            setOffset(context, appWidgetId, getOffset(context, appWidgetId) + 1);
            renderWidget(context, manager, appWidgetId);
        } else if (ACTION_TODAY.equals(action)) {
            setOffset(context, appWidgetId, 0);
            renderWidget(context, manager, appWidgetId);
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        for (int id : appWidgetIds) editor.remove(KEY_OFFSET + id);
        editor.apply();
    }

    private void renderWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        int offset = getOffset(context, appWidgetId);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);
        Resources res = context.getResources();
        String pkg = context.getPackageName();

        Calendar today = Calendar.getInstance(Locale.KOREA);
        int todayYear = today.get(Calendar.YEAR);
        int todayMonth = today.get(Calendar.MONTH);
        int todayDate = today.get(Calendar.DAY_OF_MONTH);

        Calendar cursor = Calendar.getInstance(Locale.KOREA);
        cursor.set(Calendar.DAY_OF_MONTH, 1);
        cursor.add(Calendar.MONTH, offset);
        int displayYear = cursor.get(Calendar.YEAR);
        int displayMonth = cursor.get(Calendar.MONTH);
        int firstWeekday = cursor.get(Calendar.DAY_OF_WEEK) - 1;
        int lastDay = cursor.getActualMaximum(Calendar.DAY_OF_MONTH);

        SimpleDateFormat titleFormat = new SimpleDateFormat("yyyy.MM", Locale.KOREA);
        views.setTextViewText(R.id.widget_month_title, titleFormat.format(cursor.getTime()));
        views.setTextViewText(R.id.widget_sync_status, readSyncStatus(context));

        Map<String, List<String[]>> eventsByDate = loadEvents(context);

        for (int i = 0; i < 42; i++) {
            int rootId = res.getIdentifier("cell_" + i + "_root", "id", pkg);
            int dateId = res.getIdentifier("cell_" + i + "_date", "id", pkg);
            int e1Id = res.getIdentifier("cell_" + i + "_e1", "id", pkg);
            int e2Id = res.getIdentifier("cell_" + i + "_e2", "id", pkg);
            int moreId = res.getIdentifier("cell_" + i + "_more", "id", pkg);

            views.setTextViewText(dateId, "");
            views.setInt(dateId, "setBackgroundResource", android.R.color.transparent);
            views.setViewVisibility(e1Id, View.GONE);
            views.setViewVisibility(e2Id, View.GONE);
            views.setViewVisibility(moreId, View.GONE);

            int dayNumber = i - firstWeekday + 1;
            if (dayNumber < 1 || dayNumber > lastDay) {
                continue;
            }

            views.setTextViewText(dateId, String.valueOf(dayNumber));
            int column = i % 7;
            int dateColor = Color.parseColor("#FF3C4048");
            if (column == 0) dateColor = Color.parseColor("#FFDC2626");
            else if (column == 6) dateColor = Color.parseColor("#FF2563EB");
            views.setTextColor(dateId, dateColor);

            boolean isToday = displayYear == todayYear && displayMonth == todayMonth && dayNumber == todayDate;
            if (isToday) {
                views.setInt(dateId, "setBackgroundResource", R.drawable.widget_day_today);
                views.setTextColor(dateId, Color.WHITE);
            }

            String dateKey = String.format(Locale.KOREA, "%04d-%02d-%02d", displayYear, displayMonth + 1, dayNumber);
            List<String[]> events = eventsByDate.get(dateKey);
            if (events != null && !events.isEmpty()) {
                bindEvent(views, e1Id, events.get(0));
                if (events.size() >= 2) bindEvent(views, e2Id, events.get(1));
                if (events.size() > 2) {
                    views.setViewVisibility(moreId, View.VISIBLE);
                    views.setTextViewText(moreId, "+" + (events.size() - 2));
                }
            }

            // 날짜 탭 → 앱이 그 날짜로 이동
            Intent dateIntent = new Intent(context, MainActivity.class);
            dateIntent.setAction(Intent.ACTION_VIEW);
            dateIntent.putExtra("route", "/schedule");
            dateIntent.putExtra("date", dateKey);
            dateIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            dateIntent.setData(Uri.parse("uneco://date/" + appWidgetId + "/" + dateKey));
            PendingIntent datePending = PendingIntent.getActivity(
                    context, 1000 + appWidgetId * 100 + i, dateIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(rootId, datePending);
        }

        views.setOnClickPendingIntent(R.id.widget_prev_btn, broadcast(context, appWidgetId, ACTION_PREV));
        views.setOnClickPendingIntent(R.id.widget_next_btn, broadcast(context, appWidgetId, ACTION_NEXT));
        views.setOnClickPendingIntent(R.id.widget_today_btn, broadcast(context, appWidgetId, ACTION_TODAY));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private void bindEvent(RemoteViews views, int viewId, String[] event) {
        views.setViewVisibility(viewId, View.VISIBLE);
        views.setTextViewText(viewId, event[0]);
        int color = Color.parseColor("#2563EB");
        try {
            if (event[1] != null && event[1].length() > 0) color = Color.parseColor(event[1]);
        } catch (Exception ignored) {
        }
        views.setInt(viewId, "setBackgroundColor", color);
    }

    private Map<String, List<String[]>> loadEvents(Context context) {
        Map<String, List<String[]>> map = new HashMap<>();
        try {
            SharedPreferences sp = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String json = sp.getString("widget_events", null);
            if (json == null) return map;
            JSONObject root = new JSONObject(json);
            JSONArray arr = root.optJSONArray("events");
            if (arr == null) return map;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject e = arr.optJSONObject(i);
                if (e == null) continue;
                String date = e.optString("date", null);
                if (date == null) continue;
                List<String[]> list = map.get(date);
                if (list == null) {
                    list = new ArrayList<>();
                    map.put(date, list);
                }
                list.add(new String[]{e.optString("title", ""), e.optString("color", "")});
            }
            // 연속 일정이 같은 줄에 오도록 날짜별로 제목 기준 정렬
            for (List<String[]> list : map.values()) {
                list.sort((a, b) -> a[0].compareTo(b[0]));
            }
        } catch (Exception ignored) {
        }
        return map;
    }

    private String readSyncStatus(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String json = sp.getString("widget_events", null);
            if (json == null) {
                return "동기화 없음 · 앱에서 일정관리 화면을 한 번 여세요";
            }
            JSONObject root = new JSONObject(json);
            int count = root.optJSONArray("events") != null ? root.optJSONArray("events").length() : 0;
            String updated = root.optString("updatedAt", "");
            String time = "";
            if (updated.length() >= 16) {
                time = updated.substring(5, 10).replace('-', '.') + " " + updated.substring(11, 16);
            }
            return "동기화 " + time + " · 총 " + count + "건";
        } catch (Exception e) {
            return "동기화 상태 확인 불가";
        }
    }

    private PendingIntent broadcast(Context context, int appWidgetId, String action) {
        Intent intent = new Intent(context, CalendarWidgetProvider.class);
        intent.setAction(action);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        intent.setData(Uri.parse("uneco://" + action + "/" + appWidgetId));
        return PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private int getOffset(Context context, int appWidgetId) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_OFFSET + appWidgetId, 0);
    }

    private void setOffset(Context context, int appWidgetId, int offset) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putInt(KEY_OFFSET + appWidgetId, offset).apply();
    }
}
