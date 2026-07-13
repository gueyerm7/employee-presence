<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminCommand extends Command
{
    protected $signature = 'make:admin
        {--email= : Admin email}
        {--password= : Admin password}
        {--name=Admin : Admin name}';

    protected $description = 'Create the first admin user';

    public function handle()
    {
        $email = $this->option('email') ?: env('ADMIN_EMAIL');
        $password = $this->option('password') ?: env('ADMIN_PASSWORD');

        if (!$email || !$password) {
            $this->error('ADMIN_EMAIL and ADMIN_PASSWORD env vars (or --email/--password options) are required.');
            return 1;
        }

        if (User::where('role', 'admin')->exists()) {
            $this->info('An admin user already exists. Skipping.');
            return 0;
        }

        User::create([
            'name' => $this->option('name') ?: env('ADMIN_NAME', 'Admin'),
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]);

        $this->info("Admin user created: $email");
        return 0;
    }
}
