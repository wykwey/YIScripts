# YiScripts

**YiClass 教务系统导入脚本仓库**  
YiScripts 是 YiClass 的开源脚本仓库，用于储存上传的各高校教务系统导入脚本。

所有脚本均在本地执行，不收集或上传任何用户数据。


## 简介

YiScripts 收录了不同学校的教务系统脚本，每个脚本由社区贡献，
用于在本地浏览器或本项目相关程序中自动登录教务系统并导出课程信息，
方便在 YiClass 应用中直接导入课表。



## 仓库结构

```
yiscripts/
├── index/                  # 存放各学校、公共的index.json脚本索引
│   ├── index.json          # 顶级索引，包含学校列表和脚本信息
│   ├── common/
│   │   └── index.json      # 通用脚本索引
│   └── shool_A/
│       └── index.json      # 某学校脚本索引
├── scripts/                # 实际JS脚本存放处
│   ├── common.js           # 通用抓取脚本
│   └── example.js          # 示例脚本
├── bin/                    # Dart辅助、构建脚本
│   └── build_isar.dart
├── lib/                    # Dart数据模型(Isar持久化等)
│   └── models/
│       ├── school_index.dart
│       └── school_index.g.dart
├── LICENSE
├── pubspec.yaml            # Dart项目依赖说明
└── README.md
```

各目录说明：
- **index/**: 储存脚本索引(json)，每个学校/公共脚本有独立文件夹及index.json
- **scripts/**: JS 导入脚本实际执行文件
- **bin/**: Dart 构建、工具脚本，用于代码生成等（如Isar模型构建）
- **lib/**: 存放 Dart 逻辑代码/数据模型
- **pubspec.yaml**: Dart依赖定义



## 使用方式

YiClass 应用会自动从该仓库加载脚本索引。
用户选择学校后，YiClass 将按需下载相应脚本并在本地执行。

无需手动下载或安装。



## 索引结构参考（实际示例）

### 顶级索引 `index/index.json`
```json
[
  {
    "school": "示例学校A",
    "letter_index": "A",
    "school_index": "shool_A/index.json"
  },
  {
    "school": "通用脚本集",
    "letter_index": "C",
    "school_index": "common/index.json"
  }
]
```

### 学校索引
```json
{
  "scripts": [
    {
      "name": "示例脚本集A",
      "scriptName": "example.js",
      "url": "xxx.com/login",
      "author": "Community",
      "description": "示例课程导入脚本A"
    }
  ]
}
```
```json
{
  "scripts": [
    {
      "name": "通用脚本集",
      "scriptName": "common.js",
      "url": "xxx.com/login",
      "author": "Community",
      "description": "通用课程导入脚本"
    }
  ]
}
```




## 依赖与构建


```bash
dart pub get
dart run build_runner build
```



## 免责声明

脚本仓库 YiScripts 仅供学习与研究使用。

所有脚本均由社区贡献，旨在帮助用户从各高校教务系统导出课程数据，
以便在本地 YiClass 应用中导入和管理课表信息。

### 使用风险声明

1. 本项目不提供任何破解、验证码绕过、或未经授权访问数据的功能；
2. 所有脚本仅在用户本地执行，不上传、存储或分享任何用户数据；
3. 仓库所有者及其开发者、贡献者不对因使用脚本导致的账户冻结、封禁、数据丢失或系统访问限制承担责任；
4. 用户在使用脚本时应遵守所在学校及其教务系统的相关使用条款与法律法规；
5. 所有脚本仅用于技术研究,不得用于任何商业目的或非法用途。

### 举报与处理机制

如您是学校或系统管理员，并认为本项目中的部分脚本存在侵权、违规或安全问题，
请通过 GitHub Issue 或电子邮件与我们联系，我们将在收到通知后及时进行核查与处理。



## 贡献指南

感谢您对 YiClass 教务脚本生态的支持！

贡献者需遵循以下规范：

1. 您拥有或已获得提交脚本的版权及授权；  
2. 您的脚本不会违反任何学校或网站的使用协议；  
3. 您同意以 **Apache License 2.0** 授权您的贡献；  
4. 您理解并同意本项目的免责声明；  
5. 脚本需保持可读性，不包含混淆或加密代码。  

贡献流程：

1. Fork 本仓库；
2. 在 `index/`、`scripts/` 目录下添加新学校脚本及索引；
3. 创建该校的 `index.json`、js文件；
4. 更新根目录的顶级索引 `index/index.json`；
5. 提交 Pull Request，等待审核。



## 协议

本项目采用 [Apache License 2.0](./LICENSE) 协议开源。

**本项目以 Apache License 2.0 授权发布，使用即表示您已阅读并同意本免责声明。**



© 2025 YiScripts
