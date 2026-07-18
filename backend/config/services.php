<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'consalud' => [
        'url' => rtrim((string) env('CONSALUD_URL', env('API_URL_CONSALUD', '')), '/'),
        'identity_provider' => env('IDENTITY_PROVIDER', 'consalud'),
        'connect_timeout' => (int) env('CONSALUD_CONNECT_TIMEOUT', 3),
        'timeout' => (int) env('CONSALUD_TIMEOUT', 5),
        'identity_cache_seconds' => (int) env('CONSALUD_IDENTITY_CACHE_SECONDS', 30),
        'api_user' => env('CONSALUD_API_USER'),
        'api_password' => env('CONSALUD_API_PASSWORD'),
    ],

];
