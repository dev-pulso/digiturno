<?php

use App\Models\Area;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('area.{areaId}', function ($user, $areaId) {
    return Area::find($areaId) !== null;
});
