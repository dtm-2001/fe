from flask import jsonify

def mock_metrics(mode):
    if mode == 3:
        return {
            'kpis': [
                {'rowKey': 'refTrueA', 'value': '120'},
                {'rowKey': 'refFalseB', 'value': '15'},
                {'rowKey': 'refFalseA', 'value': '8'},
                {'rowKey': 'refTrueB', 'value': '90'},
                {'rowKey': 'refPrecision', 'value': '0.88'},
                {'rowKey': 'refRecall', 'value': '0.89'},
                {'rowKey': 'refF1', 'value': '0.88'},
                {'rowKey': 'refAccuracy', 'value': '0.92'},
                {'rowKey': 'currTrueA', 'value': '110'},
                {'rowKey': 'currFalseB', 'value': '18'},
                {'rowKey': 'currFalseA', 'value': '12'},
                {'rowKey': 'currTrueB', 'value': '85'},
                {'rowKey': 'currPrecision', 'value': '0.81'},
                {'rowKey': 'currRecall', 'value': '0.82'},
                {'rowKey': 'currF1', 'value': '0.81'},
                {'rowKey': 'currAccuracy', 'value': '0.87'}
            ],
            'refTrueA': '120',
            'refFalseB': '15',
            'refFalseA': '8',
            'refTrueB': '90',
            'refPrecision': '0.88',
            'refRecall': '0.89',
            'refF1': '0.88',
            'refAccuracy': '0.92',
            'currTrueA': '110',
            'currFalseB': '18',
            'currFalseA': '12',
            'currTrueB': '85',
            'currPrecision': '0.81',
            'currRecall': '0.82',
            'currF1': '0.81',
            'currAccuracy': '0.87'
        }
    elif mode == 4:
        return {
            'kpis': [
                {'rowKey': 'runtime', 'value': '00:12:34'},
                {'rowKey': 'currTrueA', 'value': '95'},
                {'rowKey': 'currFalseB', 'value': '22'},
                {'rowKey': 'currFalseA', 'value': '15'},
                {'rowKey': 'currTrueB', 'value': '78'},
                {'rowKey': 'currPrecision', 'value': '0.79'},
                {'rowKey': 'currRecall', 'value': '0.80'},
                {'rowKey': 'currF1', 'value': '0.79'},
                {'rowKey': 'currAccuracy', 'value': '0.85'},
                {'rowKey': 'refTrueA', 'value': '105'},
                {'rowKey': 'refFalseB', 'value': '18'},
                {'rowKey': 'refFalseA', 'value': '10'},
                {'rowKey': 'refTrueB', 'value': '85'},
                {'rowKey': 'refPrecision', 'value': '0.85'},
                {'rowKey': 'refRecall', 'value': '0.86'},
                {'rowKey': 'refF1', 'value': '0.85'},
                {'rowKey': 'refAccuracy', 'value': '0.90'}
            ],
            'tableData': [
                {
                    'timePeriod': '2023-01-01',
                    'meanPrediction': 0.82,
                    'error': 0.18,
                    'exceedsThreshold': True,
                    'predicted': 'Class A',
                    'actual': 'Class B'
                },
                {
                    'timePeriod': '2023-01-02',
                    'meanPrediction': 0.85,
                    'error': 0.15,
                    'exceedsThreshold': True,
                    'predicted': 'Class B',
                    'actual': 'Class A'
                }
            ]
        }
    return {}

def mock_errors():
    return {
        'tableData': [
            {
                'timePeriod': '2023-01-01',
                'meanPrediction': 0.85,
                'error': 0.15,
                'exceedsThreshold': True
            },
            {
                'timePeriod': '2023-01-02',
                'meanPrediction': 0.82,
                'error': 0.18,
                'exceedsThreshold': True
            },
            {
                'timePeriod': '2023-01-03',
                'meanPrediction': 0.88,
                'error': 0.12,
                'exceedsThreshold': False
            }
        ],
        'legacyFormat': [
            {
                'timePeriod': '2023-01-01',
                'meanPrediction': 0.85,
                'error': 0.15,
                'exceedsThreshold': True
            },
            {
                'timePeriod': '2023-01-02',
                'meanPrediction': 0.82,
                'error': 0.18,
                'exceedsThreshold': True
            },
            {
                'timePeriod': '2023-01-03',
                'meanPrediction': 0.88,
                'error': 0.12,
                'exceedsThreshold': False
            }
        ]
    }
