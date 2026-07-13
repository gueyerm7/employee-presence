<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport de présence</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; }
        h1 { font-size: 18px; color: #4f46e5; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #4f46e5; color: white; padding: 8px 6px; text-align: left; font-size: 10px; }
        td { padding: 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .summary { margin-bottom: 24px; }
        .summary-item { display: inline-block; margin-right: 24px; }
        .summary-label { font-size: 10px; color: #666; }
        .summary-value { font-size: 16px; font-weight: bold; color: #4f46e5; }
        .footer { font-size: 9px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <h1>Rapport de présence</h1>
    <p class="subtitle">Du {{ date('d/m/Y', strtotime($startDate)) }} au {{ date('d/m/Y', strtotime($endDate)) }}</p>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-label">Employés</div>
            <div class="summary-value">{{ $summary['total_employees'] }}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Présences enregistrées</div>
            <div class="summary-value">{{ $summary['present_days'] }}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Total heures</div>
            <div class="summary-value">{{ number_format($summary['total_hours'], 2, ',', ' ') }}h</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Employé</th>
                <th>Email</th>
                <th>Total heures</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
            <tr>
                <td>{{ $row['name'] }}</td>
                <td>{{ $row['email'] }}</td>
                <td>{{ $row['total'] }}</td>
            </tr>
            @empty
            <tr><td colspan="3" style="text-align:center;color:#999;">Aucune présence trouvée.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">Généré le {{ $generatedAt }}</div>
</body>
</html>
