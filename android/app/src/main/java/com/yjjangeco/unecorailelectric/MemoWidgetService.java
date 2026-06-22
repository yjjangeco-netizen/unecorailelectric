package com.yjjangeco.unecorailelectric;

import android.content.Intent;
import android.widget.RemoteViewsService;

public class MemoWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new MemoWidgetFactory(getApplicationContext());
    }
}
