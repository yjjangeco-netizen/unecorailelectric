package com.yjjangeco.unecorailelectric;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

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

        Calendar cursor = Calendar.getInstance(Locale.KOREA);
        cursor.set(Calendar.DAY_OF_MONTH, 1);
        cursor.add(Calendar.MONTH, offset);
        SimpleDateFormat titleFormat = new SimpleDateFormat("yyyy.MM", Locale.KOREA);
        views.setTextViewText(R.id.widget_month_title, titleFormat.format(cursor.getTime()));

        // 날짜 셀 어댑터 (RemoteViewsService)
        Intent serviceIntent = new Intent(context, CalendarWidgetService.class);
        serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        serviceIntent.putExtra("offset", offset);
        // 위젯/오프셋마다 고유 인텐트가 되도록 data 설정
        serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.widget_grid, serviceIntent);
        views.setEmptyView(R.id.widget_grid, R.id.widget_empty);

        // 날짜 탭 → 앱이 그 날짜로 이동 (fill-in intent 가 date 채움)
        Intent dateIntent = new Intent(context, MainActivity.class);
        dateIntent.setAction(Intent.ACTION_VIEW);
        dateIntent.putExtra("route", "/schedule");
        dateIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent datePending = PendingIntent.getActivity(
                context, 100 + appWidgetId, dateIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
        views.setPendingIntentTemplate(R.id.widget_grid, datePending);

        // ＋ → 일정/연차 추가
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.putExtra("route", "/schedule");
        addIntent.putExtra("action", "new");
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        views.setOnClickPendingIntent(R.id.widget_add_btn, PendingIntent.getActivity(
                context, 200 + appWidgetId, addIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        // 월 이동 / 오늘 (위젯 자체 갱신)
        views.setOnClickPendingIntent(R.id.widget_prev_btn, broadcast(context, appWidgetId, ACTION_PREV));
        views.setOnClickPendingIntent(R.id.widget_next_btn, broadcast(context, appWidgetId, ACTION_NEXT));
        views.setOnClickPendingIntent(R.id.widget_today_btn, broadcast(context, appWidgetId, ACTION_TODAY));

        appWidgetManager.updateAppWidget(appWidgetId, views);
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_grid);
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
