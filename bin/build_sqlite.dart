import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:sqlite3/sqlite3.dart';

Future<void> main() async {
  final outDir = Directory('dist');
  if (!outDir.existsSync()) {
    outDir.createSync(recursive: true);
  }

  final dbPath = p.join(outDir.path, 'index.db');
  
  // 删除旧数据库文件
  final dbFile = File(dbPath);
  if (dbFile.existsSync()) {
    dbFile.deleteSync();
  }

  final db = sqlite3.open(dbPath);

  // 创建表结构
  db.execute('''
    CREATE TABLE school_index (
      id INTEGER PRIMARY KEY,
      updated_at TEXT NOT NULL
    )
  ''');

  db.execute('''
    CREATE TABLE school_entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_index_id INTEGER NOT NULL,
      school TEXT NOT NULL,
      letter_index TEXT NOT NULL,
      FOREIGN KEY (school_index_id) REFERENCES school_index(id)
    )
  ''');

  db.execute('''
    CREATE TABLE script_entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_entry_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      script_name TEXT NOT NULL,
      url TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY (school_entry_id) REFERENCES school_entry(id)
    )
  ''');

  // 创建索引
  db.execute('CREATE INDEX idx_school_entry_school_index_id ON school_entry(school_index_id)');
  db.execute('CREATE INDEX idx_script_entry_school_entry_id ON script_entry(school_entry_id)');
  db.execute('CREATE INDEX idx_school_entry_letter_index ON school_entry(letter_index)');

  // 读取顶级索引
  final topIndexFile = File(p.join('index', 'index.json'));
  if (!topIndexFile.existsSync()) {
    stderr.writeln('index/index.json not found');
    db.dispose();
    exitCode = 2;
    return;
  }

  final List<dynamic> topIndex = jsonDecode(topIndexFile.readAsStringSync()) as List<dynamic>;

  // 插入 school_index 记录
  final now = DateTime.now().toIso8601String();
  db.execute('INSERT INTO school_index (id, updated_at) VALUES (1, ?)', [now]);

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

    // 插入 school_entry
    db.execute(
      'INSERT INTO school_entry (school_index_id, school, letter_index) VALUES (1, ?, ?)',
      [schoolName, letter],
    );
    final schoolEntryId = db.lastInsertRowId;

    final Map<String, dynamic> schoolJson = jsonDecode(schoolIndexFile.readAsStringSync()) as Map<String, dynamic>;
    final List<dynamic> scriptsJson = (schoolJson['scripts'] as List?) ?? const [];

    for (final s in scriptsJson) {
      if (s is! Map) continue;
      final name = (s['name'] ?? '').toString();
      final scriptName = (s['scriptName'] ?? '').toString();
      final url = (s['url'] ?? '').toString();
      final author = (s['author'] ?? '').toString();
      final description = (s['description'] ?? '').toString();

      db.execute(
        'INSERT INTO script_entry (school_entry_id, name, script_name, url, author, description) VALUES (?, ?, ?, ?, ?, ?)',
        [schoolEntryId, name, scriptName, url, author, description],
      );
    }
  }

  db.dispose();
  stdout.writeln('SQLite DB built at $dbPath');
}
