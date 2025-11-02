import 'dart:convert';
import 'dart:io';

import 'package:isar_plus/isar_plus.dart';
import 'package:path/path.dart' as p;
import 'package:yiscripts/models/school_index.dart';

Future<void> main() async {
  final outDir = Directory('dist');
  if (!outDir.existsSync()) {
    outDir.createSync(recursive: true);
  }

  final isar = await Isar.open(
    schemas: [SchoolIndexSchema],
    directory: outDir.path,
    name: 'index',
  );

  final topIndexFile = File(p.join('index', 'index.json'));
  if (!topIndexFile.existsSync()) {
    stderr.writeln('index/index.json not found');
    exitCode = 2;
    await isar.close();
    return;
  }

  final List<dynamic> topIndex = jsonDecode(topIndexFile.readAsStringSync()) as List<dynamic>;
  final schools = <SchoolEntry>[];

  for (final entry in topIndex) {
    if (entry is! Map) continue;
    final schoolName = (entry['school'] ?? '').toString();
    final letter = (entry['letter_index'] ?? '').toString();
    final schoolIndexPath = (entry['school_index'] ?? '').toString();
    if (schoolIndexPath.isEmpty) continue;
    final schoolIndexFile = File(p.join('index', schoolIndexPath));
    if (!schoolIndexFile.existsSync()) {
      stderr.writeln('Missing school index: $schoolIndexPath');
      continue;
    }
    final Map<String, dynamic> schoolJson = jsonDecode(schoolIndexFile.readAsStringSync()) as Map<String, dynamic>;
    final List<dynamic> scriptsJson = (schoolJson['scripts'] as List?) ?? const [];
    final scripts = <ScriptEntry>[];
    for (final s in scriptsJson) {
      if (s is! Map) continue;
      final item = ScriptEntry()
        ..name = (s['name'] ?? '').toString()
        ..scriptName = (s['scriptName'] ?? '').toString()
        ..url = (s['url'] ?? '').toString()
        ..author = (s['author'] ?? '').toString()
        ..description = (s['description'] ?? '').toString();
      scripts.add(item);
    }
    final school = SchoolEntry()
      ..school = schoolName
      ..letterIndex = letter
      ..scripts = scripts;
    schools.add(school);
  }
  final schoolIndex = SchoolIndex()
    ..id = 1
    ..schools = schools
    ..updatedAt = DateTime.now();
  await isar.writeAsync((isar) {
    isar.schoolIndexs.put(schoolIndex);
  });
  await isar.close();
  stdout.writeln('Isar DB built at ${p.join(outDir.path, 'index.isar')}');
}

