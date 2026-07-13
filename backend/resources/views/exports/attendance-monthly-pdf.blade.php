<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport mensuel {{ $monthName }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #333; }
        h1 { font-size: 16px; color: #4f46e5; margin-bottom: 2px; }
        .subtitle { font-size: 11px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #4f46e5; color: white; padding: 7px 5px; text-align: left; font-size: 9px; }
        th.right { text-align: right; }
        td { padding: 5px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        td.right { text-align: right; }
        tr:nth-child(even) td { background: #f9fafb; }
        .total-row td { font-weight: bold; border-top: 2px solid #4f46e5; background: #eef2ff; }
        .footer { font-size: 8px; color: #999; text-align: center; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    </style>
</head>
<body>
    <h1>Rapport de présence mensuel</h1>
    <p class="subtitle">{{ $monthName }}</p>

    <table>
        <thead>
            <tr>
                <th>Développeur</th>
                <th class="right">Semaine 1</th>
                <th class="right">Semaine 2</th>
                <th class="right">Semaine 3</th>
                <th class="right">Semaine 4</th>
                <th class="right">Semaine 5</th>
                <th class="right">Total Mensuel</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
            <tr>
                <td>{{ $row['name'] }}</td>
                <td class="right">{{ $row['weeks'][1] }}</td>
                <td class="right">{{ $row['weeks'][2] }}</td>
                <td class="right">{{ $row['weeks'][3] }}</td>
                <td class="right">{{ $row['weeks'][4] }}</td>
                <td class="right">{{ $row['weeks'][5] }}</td>
                <td class="right">{{ $row['total'] }}</td>
            </tr>
            @empty
            <tr><td colspan="7" style="text-align:center;color:#999;">Aucune présence pour ce mois.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">Généré le {{ $generatedAt }}</div>
</body>
</html>
