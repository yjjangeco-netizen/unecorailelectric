package com.yjjangeco.unecorailelectric;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class CalendarWidgetProvider extends AppWidgetProvider {
    private static final int[] DAY_VIEW_IDS = {
            R.id.widget_day_0, R.id.widget_day_1, R.id.widget_day_2, R.id.widget_day_3, R.id.widget_day_4, R.id.widget_day_5, R.id.widget_day_6,
            R.id.widget_day_7, R.id.widget_day_8, R.id.widget_day_9, R.id.widget_day_10, R.id.widget_day_11, R.id.widget_day_12, R.id.widget_day_13,
            R.id.widget_day_14, R.id.widget_day_15, R.id.widget_day_16, R.id.widget_day_17, R.id.widget_day_18, R.id.widget_day_19, R.id.widget_day_20,
            R.id.widget_day_21, R.id.widget_day_22, R.id.widget_day_23, R.id.widget_day_24, R.id.widget_day_25, R.id.widget_day_26, R.id.widget_day_27,
            R.id.widget_day_28, R.id.widget_day_29, R.id.widget_day_30, R.id.widget_day_31, R.id.widget_day_32, R.id.widget_day_33, R.id.widget_day_34,
            R.id.widget_day_35, R.id.widget_day_36, R.id.widget_day_37, R.id.widget_day_38, R.id.widget_day_39, R.id.widget_day_40, R.id.widget_day_41
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (Intent.ACTION_DATE_CHANGED.equals(intent.getAction()) || Intent.ACTION_TIME_CHANGED.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, CalendarWidgetProvider.class);
            int[] widgetIds = manager.getAppWidgetIds(componentName);
            onUpdate(context, manager, widgetIds);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);

        Calendar today = Calendar.getInstance(Locale.KOREA);
        Calendar cursor = Calendar.getInstance(Locale.KOREA);
        cursor.set(Calendar.DAY_OF_MONTH, 1);

        int currentYear = today.get(Calendar.YEAR);
        int currentMonth = today.get(Calendar.MONTH);
        int todayDate = today.get(Calendar.DAY_OF_MONTH);
        int firstDayOfWeek = cursor.get(Calendar.DAY_OF_WEEK) - 1;
        int lastDay = cursor.getActualMaximum(Calendar.DAY_OF_MONTH);

        SimpleDateFormat titleFormat = new SimpleDateFormat("yyyy년 M월", Locale.KOREA);
        SimpleDateFormat todayFormat = new SimpleDateFormat("M월 d일 E요일", Locale.KOREA);

        views.setTextViewText(R.id.widget_month_title, titleFormat.format(today.getTime()));
        views.setTextViewText(R.id.widget_today_label, "오늘 " + todayFormat.format(today.getTime()));

        for (int i = 0; i < DAY_VIEW_IDS.length; i++) {
            int dayNumber = i - firstDayOfWeek + 1;
            int viewId = DAY_VIEW_IDS[i];

            views.setTextViewText(viewId, "");
            views.setInt(viewId, "setBackgroundResource", android.R.color.transparent);
            views.setInt(viewId, "setTextColor", Color.rgb(60, 64, 72));

            if (dayNumber < 1 || dayNumber > lastDay) {
                continue;
            }

            views.setTextViewText(viewId, String.valueOf(dayNumber));

            int column = i % 7;
            if (column == 0) {
                views.setInt(viewId, "setTextColor", Color.rgb(220, 38, 38));
            } else if (column == 6) {
                views.setInt(viewId, "setTextColor", Color.rgb(37, 99, 235));
            }

            if (currentYear == today.get(Calendar.YEAR) && currentMonth == today.get(Calendar.MONTH) && dayNumber == todayDate) {
                views.setInt(viewId, "setBackgroundResource", R.drawable.widget_day_today);
                views.setInt(viewId, "setTextColor", Color.WHITE);
            }
        }

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setData(Uri.parse("unecorailelectric://schedule"));
        openIntent.putExtra("route", "/schedule");
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        views.setOnClickPendingIntent(R.id.widget_calendar_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_open_schedule, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
