<?php
$user = App\Models\User::where('name', 'like', '%ADÁN FACHADA%')->first();
if ($user) {
    echo json_encode(['roles' => $user->getRoleNames(), 'permissions' => $user->getAllPermissions()->pluck('name')]);
} else {
    echo "User not found";
}
