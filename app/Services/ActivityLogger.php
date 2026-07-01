<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Log a controller action to the activity_logs table.
     *
     * Falls back to Laravel's Log::info channel if the DB write fails.
     *
     * @param  string  $action  Short machine-readable label  (e.g. 'candidate.store')
     * @param  string  $description  Human-readable description    (e.g. 'Created candidate profile')
     * @param  array  $properties  Any extra key/value pairs to persist
     * @param  array|null  $models  Model class names involved    (e.g. [Candidate::class, Brief::class])
     */
    public function log(
        string $action,
        string $description = '',
        array $properties = [],
        ?array $models = null
    ): void {
        $user = Auth::user();
        $request = Request::instance();
        $isAuth = Auth::check();

        $requestData = $this->sanitizeRequestData($request->all());

        $backtrace = $this->resolveCallerFromBacktrace();
        $controllerClass = $backtrace['controller'];
        $controllerMethod = $backtrace['method'];

        $payload = [
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_email' => $user?->email,
            'user_role' => $user?->role,
            'is_authenticated' => $isAuth,
            'action' => $action,
            'description' => $description,
            'controller' => $controllerClass,
            'controller_method' => $controllerMethod,
            'http_method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'request_data' => $requestData,
            'models' => $models,
            'properties' => $properties ?: null,
            'logged_at' => now(),
        ];

        try {
            ActivityLog::create($payload);
        } catch (\Throwable $e) {
            Log::info('[ActivityLogger] DB write failed — falling back to log file.', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);
        }
    }

    /**
     * Strip sensitive keys from request data before persisting.
     */
    private function sanitizeRequestData(array $data): array
    {
        $sensitive = ['password', 'password_confirmation', 'current_password', 'token', 'secret', 'api_key', 'credit_card'];

        foreach ($data as $key => $value) {
            if (in_array($key, $sensitive, true)) {
                $data[$key] = '***';
            } elseif (is_array($value)) {
                $data[$key] = $this->sanitizeRequestData($value);
            } elseif (is_string($value) && strlen($value) > 1000) {
                $data[$key] = substr($value, 0, 1000).'…[truncated]';
            }
        }

        return $data;
    }

    /**
     * Walk the call stack to find the first Controller caller.
     *
     * @return array{controller: string|null, method: string|null}
     */
    private function resolveCallerFromBacktrace(): array
    {
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 20);

        foreach ($trace as $frame) {
            $class = $frame['class'] ?? '';
            if (str_ends_with($class, 'Controller')) {
                return [
                    'controller' => $class,
                    'method' => $frame['function'] ?? null,
                ];
            }
        }

        return ['controller' => null, 'method' => null];
    }
}
