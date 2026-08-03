package com.muxu.kitchendesigner;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {
    private static final String LATEST_RELEASE_URL = "https://api.github.com/repos/shi3435254161-lgtm/empty/releases/latest";
    private static final String DOWNLOAD_PREFIX = "/shi3435254161-lgtm/empty/releases/download/";
    private static final String PREFERENCES = "app_updater";
    private static final String DOWNLOAD_ID = "download_id";
    private static final String DOWNLOAD_URL = "download_url";
    private static final String DOWNLOAD_VERSION = "download_version";

    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(LATEST_RELEASE_URL).openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(12000);
                connection.setReadTimeout(18000);
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "KitchenDesigner-Android-Updater");
                connection.setRequestProperty("X-GitHub-Api-Version", "2022-11-28");

                int responseCode = connection.getResponseCode();
                if (responseCode != HttpURLConnection.HTTP_OK) {
                    String message = responseCode == 403
                        ? "GitHub 暂时限制了更新检查，请稍后重试"
                        : "检查更新失败（HTTP " + responseCode + "）";
                    call.reject(message, "RELEASE_LOOKUP_FAILED");
                    return;
                }

                JSONObject release = new JSONObject(readStream(connection.getInputStream()));
                JSONArray assets = release.optJSONArray("assets");
                JSONObject apkAsset = findApkAsset(assets);
                if (apkAsset == null) {
                    call.reject("最新版本没有可安装的 APK 文件", "APK_NOT_FOUND");
                    return;
                }

                String latestVersion = release.optString("tag_name", "");
                String assetUrl = apkAsset.optString("browser_download_url", "");
                if (latestVersion.isEmpty() || !isTrustedApkUrl(assetUrl)) {
                    call.reject("更新文件地址无效", "UNTRUSTED_ASSET");
                    return;
                }

                String currentVersion = getInstalledVersion();
                JSObject result = new JSObject();
                result.put("currentVersion", currentVersion);
                result.put("latestVersion", latestVersion);
                result.put("updateAvailable", compareVersions(latestVersion, currentVersion) > 0);
                result.put("releaseNotes", release.optString("body", ""));
                result.put("releaseUrl", release.optString("html_url", ""));
                result.put("assetName", apkAsset.optString("name", ""));
                result.put("assetUrl", assetUrl);
                result.put("assetSize", apkAsset.optLong("size", 0));
                call.resolve(result);
            } catch (Exception error) {
                call.reject("检查更新失败，请确认网络后重试", "RELEASE_LOOKUP_FAILED", error);
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        String assetUrl = call.getString("assetUrl", "");
        String assetName = call.getString("assetName", "kitchen-designer-update.apk");
        String latestVersion = call.getString("latestVersion", "");
        if (!isTrustedApkUrl(assetUrl)) {
            call.reject("更新文件地址无效", "UNTRUSTED_ASSET");
            return;
        }
        if (!canInstallPackages()) {
            openInstallPermissionSettings();
            JSObject result = new JSObject();
            result.put("permissionRequired", true);
            call.resolve(result);
            return;
        }

        try {
            removeActiveDownload();
            String fileName = safeFileName(assetName);
            File externalFilesDirectory = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (externalFilesDirectory == null) {
                call.reject("设备存储暂不可用", "DOWNLOAD_STORAGE_UNAVAILABLE");
                return;
            }
            File updateDirectory = new File(externalFilesDirectory, "updates");
            if (!updateDirectory.exists() && !updateDirectory.mkdirs()) {
                call.reject("无法创建更新文件夹", "DOWNLOAD_DIRECTORY_FAILED");
                return;
            }
            File destination = new File(updateDirectory, fileName);
            if (destination.exists() && !destination.delete()) {
                call.reject("无法覆盖上次下载的更新文件", "DOWNLOAD_FILE_LOCKED");
                return;
            }

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(assetUrl));
            request.setTitle("木序厨卫设计更新");
            request.setDescription("正在下载 " + fileName);
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);
            request.setVisibleInDownloadsUi(true);
            request.setDestinationInExternalFilesDir(
                getContext(),
                Environment.DIRECTORY_DOWNLOADS,
                "updates/" + fileName
            );

            DownloadManager manager = getDownloadManager();
            long downloadId = manager.enqueue(request);
            SharedPreferences.Editor editor = preferences().edit();
            editor.putLong(DOWNLOAD_ID, downloadId);
            editor.putString(DOWNLOAD_URL, assetUrl);
            editor.putString(DOWNLOAD_VERSION, latestVersion);
            editor.apply();

            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            result.put("status", "downloading");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("无法开始下载更新", "DOWNLOAD_START_FAILED", error);
        }
    }

    @PluginMethod
    public void getDownloadStatus(PluginCall call) {
        long downloadId = call.getLong("downloadId", preferences().getLong(DOWNLOAD_ID, -1));
        if (downloadId <= 0) {
            JSObject result = new JSObject();
            result.put("status", "idle");
            call.resolve(result);
            return;
        }

        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        try (android.database.Cursor cursor = getDownloadManager().query(query)) {
            if (cursor == null || !cursor.moveToFirst()) {
                clearDownloadRecord();
                JSObject result = new JSObject();
                result.put("status", "missing");
                call.resolve(result);
                return;
            }

            int rawStatus = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            long downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
            long total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            result.put("downloadedBytes", downloaded);
            result.put("totalBytes", total);
            result.put("latestVersion", preferences().getString(DOWNLOAD_VERSION, ""));
            result.put("assetUrl", preferences().getString(DOWNLOAD_URL, ""));
            result.put("status", toStatus(rawStatus));
            if (rawStatus == DownloadManager.STATUS_FAILED) {
                result.put("reason", cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON)));
            }
            call.resolve(result);
        } catch (Exception error) {
            call.reject("无法读取下载状态", "DOWNLOAD_STATUS_FAILED", error);
        }
    }

    @PluginMethod
    public void installUpdate(PluginCall call) {
        long downloadId = call.getLong("downloadId", preferences().getLong(DOWNLOAD_ID, -1));
        if (!canInstallPackages()) {
            openInstallPermissionSettings();
            JSObject result = new JSObject();
            result.put("permissionRequired", true);
            call.resolve(result);
            return;
        }
        if (downloadId <= 0) {
            call.reject("没有已下载的更新文件", "DOWNLOAD_MISSING");
            return;
        }

        Uri apkUri = getDownloadManager().getUriForDownloadedFile(downloadId);
        if (apkUri == null) {
            call.reject("更新文件尚未下载完成", "DOWNLOAD_NOT_READY");
            return;
        }
        try {
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(installIntent);
            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("无法打开系统安装器", "INSTALL_LAUNCH_FAILED", error);
        }
    }

    private JSONObject findApkAsset(JSONArray assets) {
        if (assets == null) return null;
        for (int index = 0; index < assets.length(); index++) {
            JSONObject asset = assets.optJSONObject(index);
            if (asset != null && asset.optString("name", "").toLowerCase(Locale.ROOT).endsWith(".apk")) {
                return asset;
            }
        }
        return null;
    }

    private boolean isTrustedApkUrl(String value) {
        try {
            Uri uri = Uri.parse(value);
            String path = uri.getPath();
            return "https".equalsIgnoreCase(uri.getScheme())
                && "github.com".equalsIgnoreCase(uri.getHost())
                && path != null
                && path.startsWith(DOWNLOAD_PREFIX)
                && path.toLowerCase(Locale.ROOT).endsWith(".apk");
        } catch (Exception ignored) {
            return false;
        }
    }

    private String getInstalledVersion() throws Exception {
        PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
        return info.versionName == null ? "0.0.0" : info.versionName;
    }

    private int compareVersions(String first, String second) {
        String[] firstParts = normalizedVersion(first).split("\\.");
        String[] secondParts = normalizedVersion(second).split("\\.");
        for (int index = 0; index < 3; index++) {
            int firstNumber = index < firstParts.length ? parseVersionNumber(firstParts[index]) : 0;
            int secondNumber = index < secondParts.length ? parseVersionNumber(secondParts[index]) : 0;
            if (firstNumber != secondNumber) return firstNumber > secondNumber ? 1 : -1;
        }
        return 0;
    }

    private String normalizedVersion(String value) {
        String clean = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (clean.startsWith("v")) clean = clean.substring(1);
        int prereleaseStart = clean.indexOf('-');
        return prereleaseStart >= 0 ? clean.substring(0, prereleaseStart) : clean;
    }

    private int parseVersionNumber(String value) {
        try {
            return Integer.parseInt(value.replaceAll("[^0-9].*$", ""));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private boolean canInstallPackages() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getContext().getPackageManager().canRequestPackageInstalls();
    }

    private void openInstallPermissionSettings() {
        Intent settingsIntent = new Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + getContext().getPackageName())
        );
        settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(settingsIntent);
    }

    private DownloadManager getDownloadManager() {
        return (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    }

    private void removeActiveDownload() {
        long oldId = preferences().getLong(DOWNLOAD_ID, -1);
        if (oldId > 0) getDownloadManager().remove(oldId);
        clearDownloadRecord();
    }

    private void clearDownloadRecord() {
        preferences().edit().remove(DOWNLOAD_ID).remove(DOWNLOAD_URL).remove(DOWNLOAD_VERSION).apply();
    }

    private String toStatus(int status) {
        if (status == DownloadManager.STATUS_SUCCESSFUL) return "downloaded";
        if (status == DownloadManager.STATUS_FAILED) return "failed";
        if (status == DownloadManager.STATUS_PENDING) return "pending";
        if (status == DownloadManager.STATUS_PAUSED) return "paused";
        return "downloading";
    }

    private String safeFileName(String fileName) {
        String safe = fileName.replaceAll("[^A-Za-z0-9._-]", "-");
        return safe.toLowerCase(Locale.ROOT).endsWith(".apk") ? safe : "kitchen-designer-update.apk";
    }

    private String readStream(InputStream stream) throws Exception {
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) output.append(line);
        }
        return output.toString();
    }
}
