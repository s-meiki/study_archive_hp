(function () {
  const THEME_COLORS = {
    cardiology: { start: "#6b5548", end: "#c0a48f" },
    neurology: { start: "#556070", end: "#98a4bb" },
    infectious: { start: "#4f6244", end: "#a7bc96" },
    foundations: { start: "#5d5b47", end: "#b4b08c" },
    "research-career": { start: "#5b4c4c", end: "#baa09b" },
    "ai-utilization": { start: "#365a5c", end: "#9dbab7" },
  };

  const THEME_DETAIL_TEMPLATES = {
    cardiology: {
      overview: "循環器領域の病態整理から薬剤選択の考え方までを、実際の処方判断につなげて見直しやすい内容です。",
      keyPoints: [
        "病態と治療目的を結び付けて理解する",
        "薬剤選択の根拠と注意点を整理する",
        "実務で迷いやすい処方判断の視点を押さえる",
      ],
    },
    neurology: {
      overview: "神経領域で見落としやすい病態の違いと治療方針を、急性期から再発予防まで流れで確認しやすい内容です。",
      keyPoints: [
        "病態の捉え方と初期評価のポイントを整理する",
        "治療方針の切り分けと薬物療法の役割を確認する",
        "再発予防や合併症管理につながる視点を押さえる",
      ],
    },
    infectious: {
      overview: "感染症診療の全体像と抗菌薬選択の基本を、病態理解と実務判断につなげて見直しやすい内容です。",
      keyPoints: [
        "感染症診療で押さえる病態整理の基本を確認する",
        "抗菌薬選択と初期対応の考え方を整理する",
        "実務で迷いやすい評価と見直しの視点を押さえる",
      ],
    },
    foundations: {
      overview: "日常業務の土台になる基礎事項を、前提知識から順に積み上げて見直しやすい内容です。",
      keyPoints: [
        "基礎概念を曖昧にせず言語化する",
        "日常処方や評価で外しにくい基本を整理する",
        "応用に入る前に確認すべき前提を押さえる",
      ],
    },
    "research-career": {
      overview: "研究実践や認定取得、学会報告を自分の業務にどうつなげるかを意識して整理しやすい内容です。",
      keyPoints: [
        "制度や研究活動の全体像を把握する",
        "現場に持ち帰る実践ポイントを整理する",
        "継続学習や次の行動につながる視点を持つ",
      ],
    },
    "ai-utilization": {
      overview: "AIを日常業務や学習にどう安全に組み込むかを、具体的な使いどころと運用イメージで確認しやすい内容です。",
      keyPoints: [
        "AIを使う場面と使わない場面を切り分ける",
        "情報整理や下書き作成への落とし込み方を確認する",
        "個人情報や安全性への配慮を前提に運用する",
      ],
    },
  };

  const TOPIC_RULES = [
    {
      id: "atrial-fibrillation",
      label: "心房細動",
      patterns: [/心房細動/],
      overview: "抗凝固療法やレート・リズムコントロールを含め、処方の意図を追いながら整理しやすい回です。",
      keyPoints: [
        "心房細動の病態と治療目標を整理する",
        "抗凝固療法とレート・リズムコントロールの基本を確認する",
        "出血リスクや併存疾患を踏まえた薬剤選択の視点を押さえる",
      ],
    },
    {
      id: "ischemic-heart-disease",
      label: "虚血性心疾患",
      patterns: [/虚血性心疾患/, /狭心症/, /冠動脈/],
      overview: "虚血性イベントの理解から慢性期管理までをつなげて、薬物治療の組み立てを見直しやすい回です。",
      keyPoints: [
        "虚血性心疾患の病態と治療目的を整理する",
        "抗血小板薬や抗狭心症薬など主要薬剤の役割を確認する",
        "再発予防と長期管理の視点を押さえる",
      ],
    },
    {
      id: "cerebral-infarction",
      label: "脳梗塞",
      patterns: [/脳梗塞/],
      overview: "脳梗塞の分類や病態差を踏まえて、急性期対応から再発予防まで学び直しやすい回です。",
      keyPoints: [
        "脳梗塞の病態と分類を整理する",
        "急性期治療と再発予防で求められる薬物療法を確認する",
        "再発リスクや合併症管理の視点を押さえる",
      ],
    },
    {
      id: "hemorrhagic-stroke",
      label: "出血性脳卒中",
      patterns: [/出血性/, /脳卒中/],
      overview: "出血性病変の初期評価と治療方針を、虚血性疾患との違いも含めて整理しやすい回です。",
      keyPoints: [
        "出血性脳卒中の病態と初期評価を整理する",
        "降圧や止血を含む治療方針の基本を確認する",
        "虚血性疾患との考え方の違いを押さえる",
      ],
    },
    {
      id: "infectious-disease",
      label: "感染症",
      patterns: [/感染症/, /抗菌/, /感染/],
      overview: "感染症治療の全体像を踏まえて、評価の進め方と抗菌薬選択の基本を整理しやすい回です。",
      keyPoints: [
        "感染症診療で最初に確認すべき評価項目を整理する",
        "抗菌薬選択と治療方針の基本的な考え方を確認する",
        "治療効果判定と見直しの視点を押さえる",
      ],
    },
    {
      id: "fluids",
      label: "輸液",
      patterns: [/輸液/, /電解質/, /脱水/],
      overview: "輸液の基本設計を、適応や組成の違いと合わせて日常処方に結び付けて確認しやすい回です。",
      keyPoints: [
        "輸液の目的と基本的な使い分けを整理する",
        "循環や電解質の見方と補正の考え方を確認する",
        "日常業務で誤りやすいポイントを押さえる",
      ],
    },
    {
      id: "clinical-research",
      label: "臨床研究",
      patterns: [/臨床研究/, /研究/],
      overview: "研究に取り組む意味や進め方を、現場の課題設定と結び付けて理解しやすい回です。",
      keyPoints: [
        "臨床研究の目的と位置付けを整理する",
        "研究テーマの立て方と進め方の基本を確認する",
        "現場に還元する視点を持って学ぶ",
      ],
    },
    {
      id: "certification",
      label: "認定制度",
      patterns: [/認定/, /専門認定/],
      overview: "認定制度の全体像を把握し、必要な準備や学習計画へ落とし込みやすい回です。",
      keyPoints: [
        "認定制度の全体像と要件を整理する",
        "学習計画や準備の進め方を確認する",
        "日常業務と認定取得を結び付けて考える",
      ],
    },
    {
      id: "report-meeting",
      label: "報告会",
      patterns: [/報告会/, /学会/, /論文/],
      overview: "外部で得た知見を院内実務へどう持ち帰るかを、要点整理と共有の観点で見直しやすい回です。",
      keyPoints: [
        "共有された知見の要点を整理する",
        "現場に持ち帰るべき示唆を確認する",
        "次の学習や実践につながる論点を押さえる",
      ],
    },
    {
      id: "research-balance",
      label: "業務と研究の両立",
      patterns: [/両立/, /実例/],
      overview: "日常業務と研究活動を両立させるための考え方を、実例ベースで整理しやすい回です。",
      keyPoints: [
        "業務と研究を両立させる工夫を整理する",
        "時間配分や進め方の実例を確認する",
        "無理なく継続するための視点を押さえる",
      ],
    },
    {
      id: "ai-series",
      label: "AI活用",
      patterns: [/AI/, /生成AI/, /プロンプト/],
      overview: "AIの具体的な使いどころを、情報整理や学習補助など日常運用に引き寄せて確認しやすい回です。",
      keyPoints: [
        "AIを活用する目的と適した場面を整理する",
        "業務効率化や学習補助への具体的な落とし込み方を確認する",
        "個人情報や安全性への配慮を前提に使い方を見直す",
      ],
    },
  ];

  function stableHash(input) {
    let hash = 5381;

    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 33) ^ input.charCodeAt(index);
    }

    return Math.abs(hash >>> 0).toString(36);
  }

  function sanitizeSegment(input, fallback = "item") {
    const value = String(input ?? "").normalize("NFKC").toLowerCase();
    const slug = value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (slug) {
      return slug.slice(0, 64);
    }

    return `${fallback}-${stableHash(value || fallback).slice(0, 6)}`;
  }

  function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function normalizeMultilineText(value) {
    return String(value ?? "")
      .split(/\r?\n/)
      .map((line) => normalizeText(line))
      .filter(Boolean)
      .join("\n");
  }

  function uniqueStrings(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function ensureSentence(text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      return "";
    }

    return /[。.!！?？]$/.test(normalized) ? normalized : `${normalized}。`;
  }

  function resolveThemeMeta(theme) {
    if (!theme) {
      return { id: "", name: "" };
    }

    if (typeof theme === "string") {
      return { id: "", name: theme };
    }

    return {
      id: theme.id || "",
      name: theme.name || "",
      summary: theme.summary || "",
    };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });
  }

  function isExternalUrl(value) {
    return /^https?:\/\//i.test(String(value ?? "").trim());
  }

  function normalizeLinkUrl(value, options = {}) {
    const { allowRelative = true, allowHash = false } = options;
    const input = String(value ?? "").trim();

    if (!input || /[\u0000-\u001F\u007F]/.test(input)) {
      return "";
    }

    if (allowHash && input.startsWith("#")) {
      return input;
    }

    if (input.startsWith("//")) {
      return "";
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(input)) {
      try {
        const parsedUrl = new URL(input);
        return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.toString() : "";
      } catch (error) {
        return "";
      }
    }

    if (!allowRelative) {
      return "";
    }

    return input;
  }

  function sanitizeColor(value, fallback = "#365a5c") {
    const input = String(value ?? "").trim();
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(input) ? input : fallback;
  }

  function cloneSiteData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function hasValidSiteData(data) {
    return Boolean(data) && Array.isArray(data.themes) && Array.isArray(data.archives);
  }

  function getSiteData() {
    if (!hasValidSiteData(window.STUDY_ARCHIVE_DATA)) {
      return { themes: [], archives: [] };
    }

    return cloneSiteData(window.STUDY_ARCHIVE_DATA);
  }

  function serializeSiteData(data) {
    if (!hasValidSiteData(data)) {
      throw new Error("Invalid site data");
    }

    return `window.STUDY_ARCHIVE_DATA = ${JSON.stringify(data, null, 2)};\n`;
  }

  function createArchiveId(date, title) {
    const day = String(date || "undated").replace(/[^0-9]/g, "").slice(0, 8) || "undated";
    const hash = stableHash(`${date}|${title}`).slice(0, 8);
    return `archive-${day}-${hash}`;
  }

  function createArchiveSlug(archive) {
    if (archive?.slug) {
      return archive.slug;
    }

    const base = sanitizeSegment(archive?.title || archive?.id, "archive");
    const suffix = stableHash(`${archive?.id || ""}|${archive?.title || ""}`).slice(0, 6);
    return `${base}-${suffix}`;
  }

  function getArchiveDetailUrl(archive, basePath = "./archive/") {
    const archiveId = archive?.id ? encodeURIComponent(archive.id) : "";
    return `${basePath}?id=${archiveId}`;
  }

  function resolveSiteUrl(url, basePath = "./") {
    const value = normalizeLinkUrl(url, { allowRelative: true, allowHash: true });
    if (!value) {
      return "";
    }

    if (isExternalUrl(value) || value.startsWith("/") || value.startsWith("#")) {
      return value;
    }

    const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
    return `${normalizedBase}${value}`.replace(/\/{2,}/g, "/").replace(/^https:\//, "https://").replace(/^http:\//, "http://");
  }

  function parseYouTubeVideoId(url) {
    if (!url) {
      return "";
    }

    try {
      const parsedUrl = new URL(url, "https://example.com");
      const host = parsedUrl.hostname.replace(/^www\./, "");

      if (host === "youtu.be") {
        return parsedUrl.pathname.slice(1).split("/")[0];
      }

      if (host === "youtube.com" || host === "m.youtube.com") {
        if (parsedUrl.pathname === "/watch") {
          return parsedUrl.searchParams.get("v") || "";
        }

        if (parsedUrl.pathname.startsWith("/embed/") || parsedUrl.pathname.startsWith("/shorts/")) {
          return parsedUrl.pathname.split("/")[2] || "";
        }
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function getYouTubeEmbedUrl(url) {
    const videoId = parseYouTubeVideoId(url);
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : "";
  }

  function getYouTubeThumbnailUrl(url) {
    const videoId = parseYouTubeVideoId(url);
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
  }

  function getArchiveThumbnailUrl(archive, basePath = "./") {
    const recordingUrl = normalizeLinkUrl(archive?.detail?.video?.url || archive?.links?.recording, {
      allowRelative: false,
      allowHash: false,
    });
    const recordingThumbnailUrl = getYouTubeThumbnailUrl(recordingUrl);

    if (recordingThumbnailUrl) {
      return recordingThumbnailUrl;
    }

    const customImage =
      normalizeLinkUrl(archive?.thumbnail?.image, { allowRelative: true, allowHash: false }) ||
      normalizeLinkUrl(archive?.thumbnail?.imageUrl, { allowRelative: true, allowHash: false });

    if (customImage) {
      return resolveSiteUrl(customImage, basePath);
    }

    return "";
  }

  function getThemeColors(themeId) {
    return THEME_COLORS[themeId] ?? { start: "#365a5c", end: "#9dbab7" };
  }

  function buildSummary(title, themeName) {
    const cleanTitle = normalizeText(title);
    if (!cleanTitle) {
      return "";
    }

    if (themeName) {
      return `${themeName}テーマの勉強会アーカイブ。${cleanTitle}を中心に確認できる回。`;
    }

    return `${cleanTitle}を扱う勉強会アーカイブ。`;
  }

  function matchedTopicRules(text) {
    return TOPIC_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(text)));
  }

  function mostSpecificTopicRule(rules) {
    return [...rules].sort((left, right) => right.label.length - left.label.length)[0] ?? null;
  }

  function primaryTopicRule(archive) {
    const titleText = normalizeText(archive?.title);
    const titleMatches = matchedTopicRules(titleText);

    if (titleMatches.length > 0) {
      return mostSpecificTopicRule(titleMatches);
    }

    const bodyText = [archive?.title, archive?.summary, archive?.detail?.overview]
      .filter(Boolean)
      .join(" ");
    return mostSpecificTopicRule(matchedTopicRules(bodyText));
  }

  function buildSupportSentence(archive) {
    if (archive?.assets?.recording && archive?.assets?.references) {
      return "録画と参考資料を行き来しながら、理解を深めやすい構成です。";
    }

    if (archive?.assets?.recording) {
      return "録画を見返しながら、説明の流れごと復習しやすい構成です。";
    }

    if (archive?.assets?.references) {
      return "参考資料とあわせて、要点や根拠を追い直しやすい構成です。";
    }

    if (archive?.assets?.slides || archive?.assets?.notes) {
      return "スライドや要点メモを手掛かりに、ポイントを整理しやすい構成です。";
    }

    return "学習の軸になるポイントを短時間で見直しやすい内容です。";
  }

  function buildArchiveOverview(archive, theme) {
    const themeMeta = resolveThemeMeta(theme);
    const topicRule = primaryTopicRule(archive);
    const fallbackSummary = buildSummary(archive?.title, themeMeta.name);
    const summary = ensureSentence(archive?.summary || fallbackSummary);
    const focus = ensureSentence(topicRule?.overview || THEME_DETAIL_TEMPLATES[themeMeta.id]?.overview || "この回で押さえたい論点を実務に引き寄せて整理しやすい内容です。");
    const support = ensureSentence(buildSupportSentence(archive));
    const paragraphs = uniqueStrings([summary, `${focus}${support}`]).filter(Boolean);
    return paragraphs.join("\n");
  }

  function buildAssetKeyPoint(archive) {
    if (archive?.assets?.recording && archive?.assets?.references) {
      return "録画と参考資料を行き来しながら、判断の根拠になった説明箇所を押さえる";
    }

    if (archive?.assets?.recording) {
      return "録画を見返しながら、説明の流れと実務上の判断点を確認する";
    }

    if (archive?.assets?.references) {
      return "参考資料と照らし合わせて、関連知識や根拠を確認する";
    }

    return "";
  }

  function buildArchiveKeyPoints(archive, theme) {
    const themeMeta = resolveThemeMeta(theme);
    const topicRule = primaryTopicRule(archive);
    const themePoints = THEME_DETAIL_TEMPLATES[themeMeta.id]?.keyPoints ?? [
      "この回で扱う論点の全体像を整理する",
      "実務で必要な判断ポイントを確認する",
      "次に見直すべき学習課題を明確にする",
    ];

    return uniqueStrings([
      ...(topicRule?.keyPoints ?? themePoints),
      buildAssetKeyPoint(archive),
    ]).slice(0, 3);
  }

  function normalizeKeyPoints(items) {
    return Array.isArray(items)
      ? items.map((item) => normalizeText(item)).filter(Boolean)
      : [];
  }

  function normalizeChapters(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => ({
        time: normalizeText(item?.time),
        label: normalizeText(item?.label),
      }))
      .filter((item) => item.label);
  }

  function normalizeMaterials(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => ({
        label: normalizeText(item?.label),
        url: normalizeText(item?.url),
      }))
      .filter((item) => item.label && item.url);
  }

  function buildArchiveDetail(archive, theme) {
    const existingDetail = archive?.detail ?? {};
    const normalizedOverview = normalizeMultilineText(existingDetail.overview);
    const normalizedKeyPoints = normalizeKeyPoints(existingDetail.keyPoints);

    return {
      ...existingDetail,
      overview: normalizedOverview || buildArchiveOverview(archive, theme),
      keyPoints: normalizedKeyPoints.length > 0 ? normalizedKeyPoints : buildArchiveKeyPoints(archive, theme),
      chapters: normalizeChapters(existingDetail.chapters),
      materials: normalizeMaterials(existingDetail.materials),
    };
  }

  function buildSeriesKey(title) {
    return String(title ?? "")
      .normalize("NFKC")
      .replace(/【第[^】]+回】/g, "")
      .replace(/第[0-9一二三四五六七八九十]+回/g, "")
      .replace(/\((同内容|再実施|再演)[^)]*\)/g, "")
      .replace(/[「」『』【】（）()]/g, " ")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();
  }

  function extractTopicLabels(archive) {
    const text = [archive?.title, archive?.summary, archive?.detail?.overview, ...(archive?.detail?.keyPoints ?? [])]
      .filter(Boolean)
      .join(" ");
    return new Set(matchedTopicRules(text).map((rule) => rule.label));
  }

  function dateGapInDays(left, right) {
    if (!left || !right) {
      return Number.POSITIVE_INFINITY;
    }

    const leftDate = new Date(left);
    const rightDate = new Date(right);

    if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.abs(leftDate.getTime() - rightDate.getTime()) / 86400000;
  }

  function rankRelatedArchives(archive, archives, themes, options = {}) {
    const limit = Number.isFinite(options.limit) ? Math.max(1, options.limit) : 3;
    const archiveWithDetail = {
      ...archive,
      detail: buildArchiveDetail(archive, themes.find((theme) => theme.id === archive?.themeId)),
    };
    const archiveTopics = extractTopicLabels(archiveWithDetail);
    const archiveSeriesKey = buildSeriesKey(archiveWithDetail.title);
    const archiveSpeaker = normalizeText(archiveWithDetail.speaker);

    return archives
      .filter((item) => item?.id && item.id !== archiveWithDetail.id)
      .map((item) => {
        const itemTheme = themes.find((theme) => theme.id === item.themeId);
        const candidate = {
          ...item,
          detail: buildArchiveDetail(item, itemTheme),
        };
        const candidateTopics = extractTopicLabels(candidate);
        const sharedTopics = [...archiveTopics].filter((label) => candidateTopics.has(label));
        const candidateSeriesKey = buildSeriesKey(candidate.title);
        const candidateSpeaker = normalizeText(candidate.speaker);
        const reasons = [];
        let score = 0;
        let hasPrimarySignal = false;

        if (candidate.themeId === archiveWithDetail.themeId) {
          score += 4;
          reasons.push("同テーマ");
          hasPrimarySignal = true;
        }

        if (archiveSeriesKey && archiveSeriesKey === candidateSeriesKey) {
          score += 6;
          reasons.push("同シリーズ");
          hasPrimarySignal = true;
        }

        if (sharedTopics.length > 0) {
          score += Math.min(sharedTopics.length, 2) * 3;
          reasons.push(sharedTopics.slice(0, 2).join(" / "));
          hasPrimarySignal = true;
        }

        if (archiveSpeaker && archiveSpeaker === candidateSpeaker && hasPrimarySignal) {
          score += 2;
          reasons.push("同講師");
        }

        if (!hasPrimarySignal) {
          return null;
        }

        const dayGap = dateGapInDays(archiveWithDetail.date, candidate.date);
        if (dayGap <= 90) {
          score += 2;
          reasons.push("近い開催回");
        } else if (dayGap <= 240) {
          score += 1;
        }

        if (archiveWithDetail.assets?.recording && candidate.assets?.recording) {
          score += 1;
          reasons.push("録画あり");
        }

        if (archiveWithDetail.assets?.references && candidate.assets?.references) {
          score += 1;
          reasons.push("参考資料あり");
        }

        if (candidate.featured) {
          score += 0.5;
        }

        return {
          archive: candidate,
          theme: itemTheme,
          score,
          reasons: uniqueStrings(reasons),
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return String(right.archive.date || "").localeCompare(String(left.archive.date || ""));
      })
      .slice(0, limit);
  }

  function createUploadPath(archive, kind, fileName) {
    const month = archive.date ? archive.date.slice(0, 7) : "undated";
    const folder = sanitizeSegment(archive.title || archive.id, "archive");
    const extensionMatch = fileName.match(/\.[a-z0-9]+$/i);
    const extension = extensionMatch ? extensionMatch[0].toLowerCase() : "";
    const baseName = sanitizeSegment(fileName.replace(/\.[^.]+$/, ""), kind);
    return `uploads/${month}/${folder}/${kind}-${baseName}${extension}`;
  }

  window.StudyArchiveDataUtils = {
    buildArchiveDetail,
    buildArchiveKeyPoints,
    buildArchiveOverview,
    buildSummary,
    cloneSiteData,
    createArchiveId,
    createArchiveSlug,
    createUploadPath,
    escapeHtml,
    getArchiveThumbnailUrl,
    getSiteData,
    getArchiveDetailUrl,
    getThemeColors,
    getYouTubeEmbedUrl,
    getYouTubeThumbnailUrl,
    isExternalUrl,
    normalizeLinkUrl,
    sanitizeColor,
    resolveSiteUrl,
    hasValidSiteData,
    normalizeText,
    parseYouTubeVideoId,
    rankRelatedArchives,
    sanitizeSegment,
    serializeSiteData,
    stableHash,
  };
})();
