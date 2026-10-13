import copy
from pathlib import Path
import tempfile
import unittest
import transcript as t


class TranscriptTests(unittest.TestCase):
    def setUp(self):
        self.registry = {'schema_version': 1, 'series_id': 'test', 'revision': 1, 'characters': [
            {'id': 'dad', 'display_name': '爸爸 Dad', 'status': 'confirmed', 'references': [
                {'source': 'test.mp4', 'episode': 'S01E01', 'start': 0, 'end': 2, 'language': 'en',
                 'edition': 'test', 'basis': 'fixture evidence', 'sha256': 'a'*64}]}]}
        self.data = {'schema_version': 1, 'series_id': 'test', 'episode': 'S01E02', 'title': 'Test',
            'language': 'en', 'duration': 10, 'sources': [{'path': 'test.mp4', 'sha256': 'a'*64}],
            'timecode_note': 'Fixture timing', 'scope_note': 'Fixture scope',
            'coverage': {'source_ids': ['ocr:1'], 'excluded': [], 'review_note': 'Fixture coverage'},
            'segments': [{'id': 1, 'start': 1, 'end': 2, 'text': 'Hello!', 'speaker_ids': ['dad'],
                          'delivery': 'offscreen_dialogue', 'text_status': 'reviewed',
                          'speaker_status': 'reviewed', 'evidence': ['Fixture frame'],
                          'source_ids': ['ocr:1'], 'review_note': ''}]}

    def test_valid_offscreen_is_character(self):
        self.assertTrue(t.validate(self.data, self.registry)['ok'])
        self.assertIn('爸爸 Dad', t.label(self.data['segments'][0], self.registry))
        self.assertNotIn('旁白', t.label(self.data['segments'][0], self.registry))

    def test_unknown_role_rejected(self):
        self.data['segments'][0]['speaker_ids'] = ['missing']
        self.assertFalse(t.validate(self.data, self.registry)['ok'])

    def test_missing_candidate_rejected(self):
        self.data['coverage']['source_ids'].append('ocr:2')
        self.assertFalse(t.validate(self.data, self.registry)['ok'])

    def test_valid_exclusion(self):
        self.data['coverage']['source_ids'].append('ocr:2')
        self.data['coverage']['excluded'].append({'id': 'ocr:2', 'reason': 'Credits'})
        self.assertTrue(t.validate(self.data, self.registry)['ok'])

    def test_uncertainty_must_be_explained(self):
        row = self.data['segments'][0]
        row['text'] = '[歌词待核]'
        self.assertFalse(t.validate(self.data, self.registry)['ok'])
        row.update(text_status='uncertain', review_note='Music masks word')
        self.assertTrue(t.validate(self.data, self.registry)['ok'])

    def test_announcement_unknown_identity(self):
        row = self.data['segments'][0]
        row.update(speaker_ids=[], speaker_status='uncertain', delivery='title_announcement', review_note='Unknown child voice')
        report = t.validate(self.data, self.registry)
        self.assertTrue(report['ok'])
        self.assertEqual(len(report['uncertainties']), 1)
        self.assertIn('说话人待核', t.label(row, self.registry))

    def test_chorus_not_fictional_character(self):
        row = self.data['segments'][0]
        row.update(speaker_ids=[], speaker_status='group', delivery='chorus', group_label='片头合声')
        self.assertTrue(t.validate(self.data, self.registry)['ok'])
        self.assertEqual(t.label(row, self.registry), '片头合声')

    def test_nested_overlap_requires_note(self):
        self.data['segments'][0]['end'] = 8
        for number, start, end in [(2, 3, 4), (3, 5, 6)]:
            row = copy.deepcopy(self.data['segments'][0])
            row.update(id=number, start=start, end=end, overlap_note='Simultaneous voices')
            self.data['segments'].append(row)
        self.assertTrue(t.validate(self.data, self.registry)['ok'])
        del self.data['segments'][-1]['overlap_note']
        self.assertFalse(t.validate(self.data, self.registry)['ok'])

    def test_invalid_times(self):
        for start, end in [(float('nan'), 3), (3, 2), (-1, 1), (1, 11), (1, 1.00001)]:
            self.data['segments'][0].update(start=start, end=end)
            self.assertFalse(t.validate(self.data, self.registry)['ok'])

    def test_export_does_not_overwrite(self):
        with tempfile.TemporaryDirectory(prefix='.episode-test-', dir=Path.cwd()) as directory:
            result = t.export(self.data, self.registry, directory, ['txt', 'srt'])
            for path in result['output_files'].values():
                self.assertIn('爸爸 Dad（画外对白）：Hello!', Path(path).read_text(encoding='utf-8-sig'))
            with self.assertRaises(FileExistsError):
                t.export(self.data, self.registry, directory, ['txt', 'srt'])


if __name__ == '__main__':
    unittest.main()
