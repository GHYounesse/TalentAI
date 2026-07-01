<?php

namespace App\Http\Controllers\ActivityLog;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Display a paginated, filterable list of activity logs.
     *
     * @param  Request  $request  Supports: `search` (string), `action` (string), `user` (string), `date_from` (Y-m-d), `date_to` (Y-m-d)
     * @return Response Inertia page — ActivityLogs/Index — or Fallback on failure
     */
    public function index(Request $request): Response
    {
        $this->authorize('activity_logs.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $search = $request->string('search')->trim()->toString();
            $action = $request->string('action')->trim()->toString();
            $user = $request->string('user')->trim()->toString();
            $dateFrom = $request->string('date_from')->trim()->toString();
            $dateTo = $request->string('date_to')->trim()->toString();

            $logs = $this->applyFilters(
                ActivityLog::query(),
                $search, $action, $user, $dateFrom, $dateTo
            )
                ->orderByDesc('logged_at')
                ->paginate(100)
                ->withQueryString()
                ->through(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'user_id' => $log->user_id,
                    'user_name' => $log->user_name,
                    'user_email' => $log->user_email,
                    'user_role' => $log->user_role,
                    'is_authenticated' => $log->is_authenticated,
                    'controller' => $log->controller,
                    'controller_method' => $log->controller_method,
                    'http_method' => $log->http_method,
                    'url' => $log->url,
                    'ip_address' => $log->ip_address,
                    'properties' => $log->properties,
                    'models' => $log->models,
                    'logged_at' => $log->logged_at,
                ]);

            // Distinct action prefixes for the filter dropdown (e.g. "brief", "users", "roles")
            $actionGroups = ActivityLog::query()
                ->selectRaw('DISTINCT SUBSTRING_INDEX(action, ".", 1) as prefix')
                ->orderBy('prefix')
                ->pluck('prefix');

            $logger->log(
                'activity_log.index',
                'Consultation de la liste des journaux d\'activité.',
                ['filters' => compact('search', 'action', 'user', 'dateFrom', 'dateTo')],
                [ActivityLog::class]
            );

            return Inertia::render('ActivityLogs/Index', [
                'logs' => $logs,
                'actionGroups' => $actionGroups,
                'filters' => compact('search', 'action', 'user', 'dateFrom', 'dateTo'),
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'activity_log.index.error',
                'Erreur lors du chargement des journaux d\'activité : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [ActivityLog::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger les journaux d\'activité.',
            ]);
        }
    }

    /**
     * Display the full detail of a single activity log entry.
     *
     * @param  ActivityLog  $activityLog  Route-model-bound instance
     * @return Response Inertia page — ActivityLogs/Show — or Fallback on failure
     */
    private function applyFilters(
        Builder $query,
        string $search,
        string $action,
        string $user,
        string $dateFrom,
        string $dateTo,
    ): Builder {
        return $query
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('description', 'like', "%{$search}%")
                        ->orWhere('action', 'like', "%{$search}%")
                        ->orWhere('user_name', 'like', "%{$search}%")
                        ->orWhere('user_email', 'like', "%{$search}%");
                });
            })
            ->when($action, fn ($q) => $q->where('action', 'like', "%{$action}%"))
            ->when($user, fn ($q) => $q->where(function ($inner) use ($user) {
                $inner->where('user_name', 'like', "%{$user}%")
                    ->orWhere('user_email', 'like', "%{$user}%");
            }))
            ->when($dateFrom, fn ($q) => $q->whereDate('logged_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('logged_at', '<=', $dateTo));
    }

    /**
     * Display the specified activity log entry.
     */
    public function show(ActivityLog $activityLog): Response
    {
        $this->authorize('activity_logs.view');

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'activity_log.show',
                "Consultation du journal d'activité (ID : {$activityLog->id}).",
                ['activity_log_id' => $activityLog->id],
                [ActivityLog::class]
            );

            return Inertia::render('ActivityLogs/Show', [
                'log' => $activityLog,
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'activity_log.show.error',
                "Erreur lors de la consultation du journal (ID : {$activityLog->id}) : ".$e->getMessage(),
                ['activity_log_id' => $activityLog->id, 'exception' => $e->getMessage()],
                [ActivityLog::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible d\'afficher ce journal.',
            ]);
        }
    }
}
