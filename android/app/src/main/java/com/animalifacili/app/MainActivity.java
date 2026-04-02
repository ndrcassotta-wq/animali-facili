package com.animalifacili.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d("AF_NOTIFY", "onCreate intentData=" + (getIntent() != null ? getIntent().getDataString() : "null"));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        Log.d("AF_NOTIFY", "onNewIntent intentData=" + (intent != null ? intent.getDataString() : "null"));
    }
}