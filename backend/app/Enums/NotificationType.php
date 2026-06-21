<?php

namespace App\Enums;

enum NotificationType: string
{
    case WhatsApp = 'whatsapp';
    case SMS = 'sms';
}
