<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Interview extends Model
{
    use SoftDeletes;

    protected $table = 'interviews';

    protected $fillable = [
        'candidate_id',
        'brief_id',
        'interviewer_id',
        'platform',
        'recording_url',
        'duration_seconds',
        'recruiter_notes',
        'status',
        'scheduled_at',
        'completed_at',
        'expectations',
        'decision',
        'decision_comment',
        'decision_by',
        'decision_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'duration_seconds' => 'integer',
            'decision_at' => 'datetime',
        ];
    }

    public function candidate()
    {
        return $this->belongsTo(Candidat::class, 'candidate_id');
    }

    public function brief()
    {
        return $this->belongsTo(Brief::class, 'brief_id');
    }

    public function interviewer()
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }

    public function transcription(): HasOne
    {
        return $this->hasOne(Transcription::class, 'interview_id');
    }

    public function decisionBy()
    {
        return $this->belongsTo(User::class, 'decision_by');
    }

    public function report()
    {
        return $this->hasOne(InterviewReport::class);
    }
}
