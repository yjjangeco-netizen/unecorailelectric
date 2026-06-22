package com.yjjangeco.unecorailelectric;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * 메모 위젯 리스트. Capacitor Preferences("CapacitorStorage" → "widget_memos") 를 읽는다.
 */
public class MemoWidgetFactory implements RemoteViewsService.RemoteViewsFactory {

    private final Context context;
    private final List<String[]> memos = new ArrayList<>(); // [title, content, colorHex]

    MemoWidgetFactory(Context context) {
        this.context = context;
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
        memos.clear();
        try {
            SharedPreferences sp = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String json = sp.getString("widget_memos", null);
            if (json == null) return;
            JSONObject root = new JSONObject(json);
            JSONArray arr = root.optJSONArray("memos");
            if (arr == null) return;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject m = arr.optJSONObject(i);
                if (m == null) continue;
                memos.add(new String[]{
                        m.optString("title", ""),
                        m.optString("content", ""),
                        colorHex(m.optString("color", "yellow"))
                });
            }
        } catch (Exception ignored) {
        }
    }

    private String colorHex(String name) {
        if (name == null) return "#FACC15";
        switch (name.toLowerCase()) {
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

    @Override
    public int getCount() {
        return memos.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_memo_item);
        String[] memo = memos.get(position);

        String title = memo[0];
        if (title == null || title.trim().isEmpty()) title = "(제목 없음)";
        rv.setTextViewText(R.id.widget_memo_item_title, title);
        rv.setTextViewText(R.id.widget_memo_item_content, memo[1]);

        try {
            rv.setInt(R.id.widget_memo_item_bar, "setBackgroundColor", Color.parseColor(memo[2]));
        } catch (Exception ignored) {
        }

        Intent fillIn = new Intent();
        rv.setOnClickFillInIntent(R.id.widget_memo_item_root, fillIn);
        return rv;
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
        return false;
    }

    @Override
    public void onDestroy() {
        memos.clear();
    }
}
