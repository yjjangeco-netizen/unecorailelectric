package com.yjjangeco.unecorailelectric;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 달력 위젯의 42개 날짜 셀을 그린다.
 * 일정 데이터는 Capacitor Preferences(SharedPreferences "CapacitorStorage")의
 * "widget_events" 키(JSON)를 읽어 사용한다.
 */
public class CalendarWidgetFactory implements RemoteViewsService.RemoteViewsFactory {

    private static final int CELL_COUNT = 42;
    private static final int DEFAULT_COLOR = Color.parseColor("#2563EB");

    private final Context context;
    private final int monthOffset;

    private final Map<String, List<String[]>> eventsByDate = new HashMap<>();

    private int firstWeekday;
    private int lastDay;
    private int displayYear;
    private int displayMonth; // 0-based

    private int todayYear;
    private int todayMonth;
    private int todayDate;

    CalendarWidgetFactory(Context context, Intent intent) {
        this.context = context;
        this.monthOffset = intent.getIntExtra("offset", 0);
    }

    @Override
    public void onCreate() {
        load();
    }

    @Override
    public void onDataSetChanged() {
        load();
    }

    private void load() {
        eventsByDate.clear();

        Calendar today = Calendar.getInstance(Locale.KOREA);
        todayYear = today.get(Calendar.YEAR);
        todayMonth = today.get(Calendar.MONTH);
        todayDate = today.get(Calendar.DAY_OF_MONTH);

        Calendar cursor = Calendar.getInstance(Locale.KOREA);
        cursor.set(Calendar.DAY_OF_MONTH, 1);
        cursor.add(Calendar.MONTH, monthOffset);
        displayYear = cursor.get(Calendar.YEAR);
        displayMonth = cursor.get(Calendar.MONTH);
        firstWeekday = cursor.get(Calendar.DAY_OF_WEEK) - 1; // 일=0
        lastDay = cursor.getActualMaximum(Calendar.DAY_OF_MONTH);

        try {
            SharedPreferences sp = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String json = sp.getString("widget_events", null);
            if (json != null) {
                JSONObject root = new JSONObject(json);
                JSONArray arr = root.optJSONArray("events");
                if (arr != null) {
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject e = arr.optJSONObject(i);
                        if (e == null) continue;
                        String date = e.optString("date", null);
                        if (date == null) continue;
                        String title = e.optString("title", "");
                        String color = e.optString("color", "");
                        List<String[]> list = eventsByDate.get(date);
                        if (list == null) {
                            list = new ArrayList<>();
                            eventsByDate.put(date, list);
                        }
                        list.add(new String[]{title, color});
                    }
                }
            }
        } catch (Exception ignored) {
            // 데이터 없거나 파싱 실패 → 빈 달력
        }
    }

    @Override
    public int getCount() {
        return CELL_COUNT;
    }

    @Override
    public RemoteViews getViewAt(int position) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_calendar_cell);

        rv.setTextViewText(R.id.widget_cell_date, "");
        rv.setInt(R.id.widget_cell_date, "setBackgroundResource", android.R.color.transparent);
        rv.setViewVisibility(R.id.widget_cell_e1, android.view.View.GONE);
        rv.setViewVisibility(R.id.widget_cell_e2, android.view.View.GONE);
        rv.setViewVisibility(R.id.widget_cell_more, android.view.View.GONE);

        int dayNumber = position - firstWeekday + 1;
        if (dayNumber < 1 || dayNumber > lastDay) {
            return rv;
        }

        rv.setTextViewText(R.id.widget_cell_date, String.valueOf(dayNumber));

        int column = position % 7;
        int dateColor = Color.parseColor("#FF3C4048");
        if (column == 0) dateColor = Color.parseColor("#FFDC2626");
        else if (column == 6) dateColor = Color.parseColor("#FF2563EB");
        rv.setTextColor(R.id.widget_cell_date, dateColor);

        boolean isToday = displayYear == todayYear && displayMonth == todayMonth && dayNumber == todayDate;
        if (isToday) {
            rv.setInt(R.id.widget_cell_date, "setBackgroundResource", R.drawable.widget_day_today);
            rv.setTextColor(R.id.widget_cell_date, Color.WHITE);
        }

        String dateKey = String.format(Locale.KOREA, "%04d-%02d-%02d", displayYear, displayMonth + 1, dayNumber);
        List<String[]> events = eventsByDate.get(dateKey);
        if (events != null && !events.isEmpty()) {
            bindEvent(rv, R.id.widget_cell_e1, events.get(0));
            if (events.size() >= 2) {
                bindEvent(rv, R.id.widget_cell_e2, events.get(1));
            }
            if (events.size() > 2) {
                rv.setViewVisibility(R.id.widget_cell_more, android.view.View.VISIBLE);
                rv.setTextViewText(R.id.widget_cell_more, "+" + (events.size() - 2));
            }
        }

        Intent fillIn = new Intent();
        fillIn.putExtra("date", dateKey);
        rv.setOnClickFillInIntent(R.id.widget_cell_root, fillIn);

        return rv;
    }

    private void bindEvent(RemoteViews rv, int viewId, String[] event) {
        rv.setViewVisibility(viewId, android.view.View.VISIBLE);
        rv.setTextViewText(viewId, event[0]);
        int color = DEFAULT_COLOR;
        try {
            if (event[1] != null && event[1].length() > 0) {
                color = Color.parseColor(event[1]);
            }
        } catch (Exception ignored) {
        }
        rv.setInt(viewId, "setBackgroundColor", color);
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }

    @Override
    public void onDestroy() {
        eventsByDate.clear();
    }
}
