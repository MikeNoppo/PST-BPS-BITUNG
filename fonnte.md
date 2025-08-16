# Fonnte API Documentation

Dokumentasi ini menjelaskan cara menggunakan API Fonnte untuk mengirim pesan teks, gambar, dan file lainnya melalui WhatsApp.

## Endpoint

Untuk mengirim pesan, gunakan metode **POST** ke URL berikut:

`https://api.fonnte.com/send`

## Headers

Permintaan Anda harus menyertakan header otorisasi dengan token API Anda.

* **Key**: `Authorization`
* **Value**: `TOKEN_ANDA`

TOKEN BISA DI CEK DI .ENV

Contoh:

`Authorization: TOKEN_ANDA`

## Body Request (Parameter)

Berikut adalah penjelasan detail untuk setiap parameter yang dapat Anda kirim dalam body permintaan:

### `target` (string) - **Wajib**

Parameter `target` adalah tujuan penerima pesan WhatsApp.

* **Jenis Nilai**: Dapat berupa **Nomor WhatsApp**, **ID Grup**, atau **ID Rotator**.
* **Kombinasi**: Nilainya bisa salah satu atau kombinasi dari ketiganya.
* **Format**: Nilai **harus** berupa `string`, tidak boleh angka (`integer`).
* **Jumlah**: Tidak ada batasan jumlah target. Pisahkan beberapa target dengan koma (`,`).
* **Contoh Benar**: `'target' => '081xxxx,082xxxx,123xxxx@g.us'`
* **Contoh Salah**: `'target' => 081xxxx`

### `message` (string)

Parameter `message` adalah isi pesan teks yang akan dikirim.

* **Emoji**: Mendukung penggunaan emoji.
* **Panjang Maksimum**: Tidak boleh melebihi 60.000 karakter.
* **Catatan Karakter**: Perhatikan bahwa beberapa emoji atau karakter khusus (Cina, Jepang, Arab, dll.) dapat dihitung sebagai beberapa karakter. Karakter yang tidak didukung UTF-8 mungkin tidak terkirim dengan benar.
* **Caption File**: `message` juga berfungsi sebagai *caption* untuk file/gambar jika Anda menyertakan parameter `url`.

### `url` (string)

Parameter `url` digunakan untuk mengirim lampiran file seperti gambar, video, atau dokumen.

* **Catatan**: Parameter ini hanya tersedia pada paket Super/Advanced/Ultra.
* **Aksesibilitas**: URL harus dapat diakses secara publik. Tidak bisa menggunakan URL `localhost` atau IP privat.
* **Jenis URL**: URL harus langsung menuju ke file, bukan halaman web yang berisi file tersebut.
* **Contoh Benar**: `https://fonnte.com/image.png`
* **Contoh Salah**: `https://fonnte.com/halaman-dengan-gambar`

### `filename` (string)

Parameter `filename` digunakan untuk menentukan nama file yang akan diterima oleh penerima.

* **Fungsi**: Parameter ini hanya berfungsi untuk file selain gambar dan video (misalnya, dokumen PDF, ZIP, dll.).
* **Batasan**: Gambar dan video tidak akan menggunakan nama file ini.
* **Contoh**: `'filename' => 'laporan-bulanan.pdf'`

### `schedule` (integer)

Jadwalkan pengiriman pesan. Nilainya harus dalam format Unix Timestamp.

### `delay` (string)

Tunda pengiriman pesan dalam satuan detik. Contoh: `"2"` akan menunda pengiriman selama 2 detik.

### `countryCode` (string)

Kode negara untuk nomor tujuan. Defaultnya adalah `62` untuk Indonesia.

## Contoh Kode

Berikut adalah contoh penggunaan API Fonnte menggunakan cURL di PHP untuk mengirim pesan yang berisi teks dan gambar.

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => '[https://api.fonnte.com/send](https://api.fonnte.com/send)',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => array(
    'target' => '08123456789|Fonnte|Admin,08123456788|Lili|User',
    'message' => 'Ini adalah pesan tes untuk {name} sebagai {var1}.',
    'url' => '[https://md.fonnte.com/images/wa-logo.png](https://md.fonnte.com/images/wa-logo.png)',
    'filename' => 'logo-whatsapp',
    'schedule' => 0,
    'typing' => false,
    'delay' => '2',
    'countryCode' => '62',
  ),
  CURLOPT_HTTPHEADER => array(
    // Ganti TOKEN_ANDA dengan token API Anda
    'Authorization: TOKEN_ANDA'
  ),
));

$response = curl_exec($curl);

if (curl_errno($curl)) {
  $error_msg = curl_error($curl);
}

curl_close($curl);

if (isset($error_msg)) {
  echo $error_msg;
}

echo $response;

?>
````

### Penjelasan Contoh Kode:

  * **target**: Mengirim pesan ke dua nomor dengan variabel `name` dan `var1` yang berbeda untuk setiap nomor.
  * **message**: Pesan akan dipersonalisasi menggunakan variabel `{name}` dan `{var1}` yang didefinisikan di `target`.
  * **url**: Mengirim gambar dari URL yang ditentukan.
  * **delay**: Pesan akan dikirim dengan jeda 2 detik.
  * **Authorization**: Pastikan untuk mengganti `TOKEN_ANDA` dengan token API Fonnte Anda yang sebenarnya.

## Contoh Response

### Response Sukses

Contoh response jika pengiriman berhasil masuk antrian:

```json
{
    "detail": "success! message in queue",
    "id": [
        "80367170"
    ],
    "process": "pending",
    "requestid": 2937124,
    "status": true,
    "target": [
        "6282227097005"
    ]
}
```

Ada 3 kemungkinan `detail` pada response sukses:

1.  **Success\! message in queue**: Pesan akan segera diproses.
2.  **Success\! message will be sent on scheduled time**: Pesan akan diproses sesuai jadwal yang ditentukan.
3.  **Success\! message pending due to server issue, will be sent later**: Terjadi masalah pada server, tetapi pesan Anda telah disimpan dan akan dikirim segera setelah server kembali normal.

### Response Gagal

Response gagal akan selalu mengembalikan `status: false`.

  * **Token tidak valid**:
    ```json
    {
        "Status": false,
        "reason": "token invalid",
        "requestid": 2937124
    }
    ```
  * **Device tidak terdaftar pada akun**:
    ```json
    {
        "Status": false,
        "reason": "devices must belong to an account",
        "requestid": 2937124
    }
    ```
  * **Input tidak valid**:
    ```json
    {
        "reason": "input invalid",
        "status": false,
        "requestid": 2937124
    }
    ```
  * **URL tidak valid**:
    ```json
    {
        "reason": "url invalid",
        "status": false,
        "requestid": 2937124
    }
    ```
  * **URL tidak dapat dijangkau**:
    ```json
    {
        "reason": "url unreachable",
        "status": false,
        "requestid": 2937124
    }
    ```
  * **Format file tidak didukung**:
    ```json
    {
        "reason": "file format not supported",
        "status": false,
        "requestid": 2937124
    }
    ```
  * **Ukuran file melebihi 4MB**:
    ```json
    {
        "reason": "file size must under 4MB",
        "status": false,
        "requestid": 2937124
    }
    ```
  * **Target tidak valid**:
    ```json
    {
        "reason": "target invalid",
        "status": false,
        "requestid": 2937124
    }
    ```
  * **Format JSON tidak valid**:
    ```json
    {
        "reason": "JSON format invalid",
        "status": false,
        "requestid": 2937124
    }
    ```
  * **Kuota tidak mencukupi**:
    ```json
    {
        "reason": "insufficient quota",
        "status": false,
        "requestid": 2937124
    }
    ```