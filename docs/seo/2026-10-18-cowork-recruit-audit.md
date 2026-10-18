# トリオランド採用記事 監査レポート（Cowork／2026-10-18）

指示書：`docs/handoff/2026-10-18-cowork-recruit-seo-quality.md`／方針：`docs/seo/2026-10-18-recruit-seo-policy.md`

## 1. まとめ

| 項目 | 結果 |
|---|---|
| 監査した記事数 | **121本**（`site/recruit/*.html`、index を除く。2026-09 公開86本・2026-10 公開35本） |
| 本文の文字数 | 中央値 953字。1,000字未満が69本。585字前後の薄い記事もある |
| 「面接で確認」「公開情報では分からない」で終わる記事 | 53本 |
| 重複・統合候補 | **31本**（うち調理の7本は保留）→ 統合先 12本に集約する案 |
| 削除・301 | **0本**（検索データ未取得のため実施しない） |
| タイトル変更 | **0本**（GSC の表示回数・CTR が未取得で、変える根拠がないため。§6 参照） |
| 本文の修正 | **40本**（勤務地の誤解を招く文を直した39本＋給与記事の書き直し1本） |
| CTA の変更 | **121本すべて** |
| 採用LP | 30秒まとめ・募集職種を上に・スマホ固定CTA（本番確認済み） |
| KPI | すべて **未取得**（§7） |

## 2. P0（最優先）

| # | 内容 | 状態 |
|---|---|---|
| P0-1 | 運営会社ページ（www.triocareer.jp/company/recruit/）の **保育補助 パート時給1,000円以上・調理 パート時給1,100円以上** は、2026-10-01 からの東京都の最低賃金 1,280円を下回る | **未実装**（Cowork からは WordPress を編集しない。正式な改訂額が確認できるまで新しい金額は書かない。記事121本には1,000円・1,100円の記載が無いことを確認済み＝記事への転記は無し） |
| P0-2 | 記事 `hoikushi-tokyo23-salary-condition-guide` が、会社ページの「月給28万円〜（東京都23区内在住の場合）」を唯一の金額として載せていた。採用ページ（hoiku）は「月給 310,500円〜」 | **本番確認済み**（採用ページの 310,500円〜 を先に示し、会社ページには別表記があること、関係は公開情報では分からないことを書いた。新しい金額は作っていない） |
| P0-3 | 保育士・保育補助・看護師の記事 39本が「勤務地は駒沢大学園（だけ）」と読める書き方だった。採用ページでは保育士・保育補助とも **駒沢大学園・梅ヶ丘園の2園** | **本番確認済み**（該当文を2園に置き換え。調理記事は §4 のとおり保留） |

記事内の金額は、上記の 310,500円（採用ページと同じ）以外に無い（`grep '[0-9,]+円'` で確認）。

## 3. 指定6本の比較

| 比較 | 検索意図 | 判断 |
|---|---|---|
| `nursery-cook-allergy-meal-role-guide`（540字）×`nursery-cook-food-safety-records-role-guide`（1,233字） | どちらも「調理スタッフの仕事の範囲」。後者は本文で「アレルギー対応とは別の観点」と断っており、分けたこと自体が食い合いの印 | 2本とも `nursery-cook-daily-flow-check-guide`（調理の仕事内容）へ統合する案。ただし調理の募集継続が要確認のため **保留** |
| `nursery-cook-qualification-required-check-guide`（705字）×`nursery-cook-experience-preferred-guide`（684字） | どちらも「資格・経験者優遇」と「未経験可」の読み方。出典も同じ公開情報 | `qualification-required` を残し、`experience-preferred` を統合する案（**保留**） |
| `hoiku-assistant-daily-flow-check-guide`（757字）×`hoiku-assistant-first-day-preparation-guide`（870字） | 前者は応募前の「仕事の流れ」、後者は入職初日。前者の本文にすでに「面接では最初の1日を聞く」があり重なる | `daily-flow` を「保育補助の仕事内容」の受け皿にし、初日・清掃・おむつ替え・午睡・散歩の5本を章として統合する案（**P1**、GSC 確認後） |

## 4. 調理・看護師の扱い（要確認）

- 調理スタッフの記事 **21本**：採用ページ（hoiku.triocareer.jp/recruit.html）に調理の募集が無い。会社ページには「調理スタッフ（駒沢大学園）」がある。**募集が今もあるか、オーナーに要確認**。確認できるまで、調理記事の本文には手を入れていない（壊れていた内部リンク1か所の付け替えと CTA の追加のみ）。
- 看護師の記事 **8本**：採用ページでは看護師・准看護師は「保育士」の応募資格として案内している。看護師として別の職種で募集しているかは **要確認**。記事は「保育士の枠で資格を生かす」書き方なので、勤務地だけ2園に直した。

## 5. 統合案（canonical／301 とリスク）

方針：**検索データを見ずに削除・301 はしない**。下の案は GSC（過去3か月の表示回数・クリック・掲載順位・検索語）を Codex が取得したあとに確定する。

| 統合先（残す） | 統合する記事 | 手順案 |
|---|---|---|
| hoiku-assistant-daily-flow-check-guide | first-day-preparation／cleaning-hygiene-role／diaper-meal-care-role／nap-watch-duty／outdoor-walk-duties | 統合先に章を足す→旧URLは 301→統合先へ。sitemap・一覧から外す |
| nursery-job-offer-condition-checklist | break-time／overtime-takehome／trial-bonus-raise／housing-support／leave-benefits | 同上 |
| hoikushi-salary-hourly-pay-check-guide | tokyo23-salary-condition | 同上（P0 修正は先に済ませた） |
| hoikushi-job-negotiable-hours-guide | hoiku-assistant-negotiable-hours | 同上 |
| hoikushi-care-work-scope-guide | disaster-drill／events-preparation／parent-communication／tannin-free | 同上 |
| return-to-work-hoikushi-komazawa | ojt-training-return-to-work | 同上 |
| around-20-capacity-nursery-job | small-nursery-staffing-check | 同上 |
| development-learning-hoikushi | sensory-integration-hoikushi-career | 同上 |
| hoikushi-job-posting-official-info-compare | current-opening-official-check／recruit-employer-company-check | 同上 |
| trioland-application-form-guide | recruit-application-selection-contact | 同上 |
| hoiku-assistant-childcare-supporter-course-guide | child-support-worker-hoiku-assistant | 同上 |
| nurse-fulltime-nursery-job-guide | nurse-parttime-nursery-job-guide | 同上 |
| （調理・保留）nursery-cook-daily-flow-check-guide ほか | allergy／food-safety／plating／menu-ordering／experience-preferred／qualification-allowance／cooking-staff-setagaya | 募集継続の確認後 |

リスク：
- 統合する記事に、検索流入が統合先より多いものがあれば、そちらを残す側にする。
- 301 は静的サイトなので、Cloudflare Workers 側のリダイレクトが必要（Codex の担当）。
- 統合で記事数は減るが、指示書の目的（応募数）には影響しない。応募への導線は §6 の CTA で補う。

## 6. 実施した変更（Cowork／2026-10-18）

| 変更 | 対象 | 状態 |
|---|---|---|
| 採用LP：「30秒でわかる、トリオランドの募集」（どんな園／どんな仕事／応募資格／勤務地／勤務条件／応募方法）を最初に置き、募集職種をその直後へ移動。動画は後ろへ | /recruit.html（build_site.py・site.css。コミット 020c5c4、CI ビルド 11b06ff） | **本番確認済み**（本番を取得し、見出しと6項目・並び順・`v=20261018-01` を確認。スマホ390px・PC1366px は同じビルドを手元の Playwright で確認、横はみ出しなし） |
| 採用LP：スマホだけ画面下に「応募・相談する／見学を申し込む」を固定。フォームが見えたら隠す | 同上 | **本番確認済み**（本番のHTMLにバーがあることを確認。隠れる動きは手元で確認） |
| 記事CTA：全121本に「応募・相談フォームへ（/recruit.html#form）」「園見学を申し込む（/contact.html）」を追加。採用ページへのリンク先を `#jobs`→`#summary`（30秒まとめ）へ | site/recruit/*.html（`tools/recruit_quality.py` を recruit-sitemap.yml から毎回実行。今後の新記事にも自動で入る） | **本番確認済み**（d772c0b→CI bf85c04 で120本に反映、手元の結果と一致。本番の記事を取得してブロックとリンク先を確認） |
| 壊れた内部リンク2か所を、ある記事へ付け替え | hoiku-assistant-daily-flow-check-guide／nursery-cook-daily-flow-check-guide | 本番確認済み（同上） |
| P0-2・P0-3 | §2 | 本番確認済み（給与記事・午睡の記事を本番で取得して確認） |

LP・記事とも、確認できない待遇・職員の声・研修・採用実績は書いていない。数字は採用ページにすでにあるもの（月給 310,500円〜・月1シフト制・月公休10日・定員19名／20名・駅徒歩）だけを使った。

タイトル：変更なし。いまのタイトルは「〜を確認する方法｜〜」の型がそろっていて区別しにくいが、どの検索語で表示されているかが分からないまま変えると、今ある表示を失うおそれがある。GSC のデータが入ったら、表示回数が多く CTR が低い記事から直す。

## 7. KPI

| 段階 | 値 |
|---|---|
| 検索の表示回数・クリック（GSC） | 未取得 |
| 記事→採用ページへのクリック | 未取得（計測が未設定） |
| 応募フォーム送信数 | 未取得 |
| 面接数 | 未取得 |
| 採用数 | 未取得 |

## 8. 残り（理由つき）

| 項目 | 理由 |
|---|---|
| 会社ページの時給（P0-1） | WordPress の編集は Cowork の担当外。正式な改訂額が未確認（オーナー確認待ち） |
| 統合・301 | GSC のデータ未取得（Codex） |
| 調理記事21本の修正 | 募集継続が要確認（オーナー） |
| 「面接で確認」だけの記事の中身を厚くする | 書ける事実が無い。事実を作らないため、統合で解決する（§5） |
| CTA のクリック計測 | GA4 のイベント設定（Codex） |
| 新しい記事 | 今週は0本。統合が先 |

## 9. 記事ごとの監査表（121本）

列の意味：「確認が必要」系＝「面接で確認」「公開情報では分からない」などの数。内部リンク＝本文中の他記事へのリンク数（監査時点）。

| 優先 | 記事（/recruit/…） | 意図クラスタ | 判定 | 統合先候補 | 字数 | 「確認が必要」系 | 内部リンク | 公開日 | メモ |
|---|---|---|---|---|---|---|---|---|---|
| P0 | hoikushi-tokyo23-salary-condition-guide | 保育士｜条件の確認 | 統合候補 | hoikushi-salary-hourly-pay-check-guide | 818 | 5 | 2 | 2026-09-28 | 【P0】会社ページの「月給28万円〜（23区内在住）」を唯一の金額として載せていた→採用ページの 310,500円〜 を先に示す形に修正済み（2026-10-18） |
| P1 | hoikushi-salary-hourly-pay-check-guide | 保育士｜条件の確認 | 統合先 |  | 721 | 3 | 2 | 2026-09-21 | 給与の受け皿 |
| P1 | nursery-job-offer-condition-checklist | 保育士｜条件の確認 | 統合先 |  | 1180 | 4 | 2 | 2026-09-16 | 条件確認系の受け皿。各条件記事の要点を章にまとめ、トリオランドで公開している条件（月給310,500円〜・月1シフト制・月公休10日・2園）を最初に置く／勤務地の記述を2園に修正済み |
| P1 | hoiku-assistant-cleaning-hygiene-role-guide | 保育補助｜仕事内容・1日 | 統合候補 | hoiku-assistant-daily-flow-check-guide | 515 | 4 | 1 | 2026-10-15 | どれも「保育業務全般」以外は非公開→「面接で確認」で終わる構成。1本ずつでは求職者の疑問に答えきれない／勤務地の記述を2園に修正済み |
| P1 | hoiku-assistant-daily-flow-check-guide | 保育補助｜仕事内容・1日 | 統合先 |  | 757 | 1 | 2 | 2026-10-10 | 「保育補助 仕事内容」の受け皿。役割記事5本をこの1本に章として集約する案 |
| P1 | hoiku-assistant-diaper-meal-care-role-guide | 保育補助｜仕事内容・1日 | 統合候補 | hoiku-assistant-daily-flow-check-guide | 1192 | 4 | 2 | 2026-10-16 | どれも「保育業務全般」以外は非公開→「面接で確認」で終わる構成。1本ずつでは求職者の疑問に答えきれない |
| P1 | hoiku-assistant-first-day-preparation-guide | 保育補助｜仕事内容・1日 | 統合候補 | hoiku-assistant-daily-flow-check-guide | 870 | 4 | 2 | 2026-09-26 | どれも「保育業務全般」以外は非公開→「面接で確認」で終わる構成。1本ずつでは求職者の疑問に答えきれない |
| P1 | hoiku-assistant-nap-watch-duty-guide | 保育補助｜仕事内容・1日 | 統合候補 | hoiku-assistant-daily-flow-check-guide | 770 | 6 | 2 | 2026-10-13 | どれも「保育業務全般」以外は非公開→「面接で確認」で終わる構成。1本ずつでは求職者の疑問に答えきれない／勤務地の記述を2園に修正済み |
| P1 | hoiku-assistant-outdoor-walk-duties-guide | 保育補助｜仕事内容・1日 | 統合候補 | hoiku-assistant-daily-flow-check-guide | 508 | 4 | 1 | 2026-10-15 | どれも「保育業務全般」以外は非公開→「面接で確認」で終わる構成。1本ずつでは求職者の疑問に答えきれない／勤務地の記述を2園に修正済み |
| P1 | trioland-application-form-guide | 応募手続き | 統合先 |  | 691 | 1 | 2 | 2026-09-21 | 指名検索「トリオランド 応募」の受け皿 |
| P2 | hoikushi-ojt-training-return-to-work-guide | 保育士｜キャリア・復職 | 統合候補 | return-to-work-hoikushi-komazawa | 1297 | 7 | 2 | 2026-10-16 | 「ブランク 保育士 復職」で意図が重なる／勤務地の記述を2園に修正済み |
| P2 | return-to-work-hoikushi-komazawa | 保育士｜キャリア・復職 | 統合先 |  | 957 | 1 | 2 | 2026-09-12 | 勤務地の記述を2園に修正済み |
| P2 | hoikushi-care-work-scope-guide | 保育士｜仕事内容 | 統合先 |  | 823 | 3 | 2 | 2026-09-28 | 「保育業務全般」の受け皿 |
| P2 | hoikushi-disaster-drill-duty-guide | 保育士｜仕事内容 | 統合候補 | hoikushi-care-work-scope-guide | 722 | 5 | 2 | 2026-10-13 | 役割1つごとに1記事。公開事実が無く「面接で確認」で終わる／勤務地の記述を2園に修正済み |
| P2 | hoikushi-events-preparation-workload-guide | 保育士｜仕事内容 | 統合候補 | hoikushi-care-work-scope-guide | 521 | 5 | 1 | 2026-10-15 | 役割1つごとに1記事。公開事実が無く「面接で確認」で終わる／勤務地の記述を2園に修正済み |
| P2 | hoikushi-parent-communication-role-guide | 保育士｜仕事内容 | 統合候補 | hoikushi-care-work-scope-guide | 730 | 4 | 2 | 2026-10-13 | 役割1つごとに1記事。公開事実が無く「面接で確認」で終わる／勤務地の記述を2園に修正済み |
| P2 | hoikushi-tannin-free-role-check-guide | 保育士｜仕事内容 | 統合候補 | hoikushi-care-work-scope-guide | 530 | 5 | 1 | 2026-10-15 | 役割1つごとに1記事。公開事実が無く「面接で確認」で終わる／勤務地の記述を2園に修正済み |
| P2 | hoikushi-break-time-workday-check-guide | 保育士｜条件の確認 | 統合候補 | nursery-job-offer-condition-checklist | 1035 | 4 | 2 | 2026-09-20 | トリオランドの事実がほぼ無く「面接で確認」が中心。検索流入を確認してから統合 |
| P2 | hoikushi-housing-support-benefits-check-guide | 保育士｜条件の確認 | 統合候補 | nursery-job-offer-condition-checklist | 633 | 3 | 2 | 2026-10-17 | トリオランドの事実がほぼ無く「面接で確認」が中心。検索流入を確認してから統合／勤務地の記述を2園に修正済み |
| P2 | hoikushi-job-negotiable-hours-guide | 保育士｜条件の確認 | 統合先 |  | 1072 | 5 | 2 | 2026-09-17 | 勤務地の記述を2園に修正済み |
| P2 | hoikushi-leave-benefits-checklist | 保育士｜条件の確認 | 統合候補 | nursery-job-offer-condition-checklist | 810 | 3 | 2 | 2026-09-13 | トリオランドの事実がほぼ無く「面接で確認」が中心。検索流入を確認してから統合 |
| P2 | hoikushi-overtime-takehome-work-check-guide | 保育士｜条件の確認 | 統合候補 | nursery-job-offer-condition-checklist | 1150 | 5 | 2 | 2026-09-20 | トリオランドの事実がほぼ無く「面接で確認」が中心。検索流入を確認してから統合 |
| P2 | hoikushi-trial-bonus-raise-check-guide | 保育士｜条件の確認 | 統合候補 | nursery-job-offer-condition-checklist | 1109 | 6 | 2 | 2026-09-20 | トリオランドの事実がほぼ無く「面接で確認」が中心。検索流入を確認してから統合 |
| P2 | hoiku-assistant-negotiable-hours-guide | 保育補助｜働き方 | 統合候補 | hoikushi-job-negotiable-hours-guide | 712 | 3 | 2 | 2026-10-12 | 保育士版と本文類似度0.65。「勤務時間 応相談」の意図は職種で分けるほどの差がない |
| P2 | child-support-worker-hoiku-assistant | 保育補助｜経験の生かし方 | 統合候補 | hoiku-assistant-childcare-supporter-course-guide | 655 | 1 | 1 | 2026-09-11 | 子育て支援員の経験という同じ意図。本文の大半が同じ公開情報の言い換え |
| P2 | hoiku-assistant-childcare-supporter-course-guide | 保育補助｜経験の生かし方 | 統合先 |  | 1260 | 4 | 2 | 2026-10-16 | 勤務地の記述を2園に修正済み |
| P2 | around-20-capacity-nursery-job | 園の特徴 | 統合先 |  | 585 | 2 | 2 | 2026-09-10 |  |
| P2 | development-learning-hoikushi | 園の特徴 | 統合先 |  | 560 | 0 | 1 | 2026-09-10 |  |
| P2 | sensory-integration-hoikushi-career | 園の特徴 | 統合候補 | development-learning-hoikushi | 1152 | 2 | 1 | 2026-09-16 | 発達・運動発達の学びという同じ意図 |
| P2 | small-nursery-staffing-check-guide | 園の特徴 | 統合候補 | around-20-capacity-nursery-job | 864 | 5 | 2 | 2026-10-10 | 定員20名前後という同じ意図 |
| P2 | hoikushi-current-opening-official-check-guide | 応募手続き | 統合候補 | hoikushi-job-posting-official-info-compare | 518 | 1 | 0 | 2026-09-30 | 「公式情報で確かめる」という同じ意図。518〜652字と薄い／勤務地の記述を2園に修正済み |
| P2 | hoikushi-job-posting-official-info-compare | 応募手続き | 統合先 |  | 1168 | 3 | 1 | 2026-09-18 |  |
| P2 | recruit-application-selection-contact-guide | 応募手続き | 統合候補 | trioland-application-form-guide | 594 | 4 | 1 | 2026-09-26 | 応募方法と応募後の流れは1本で足りる |
| P2 | recruit-employer-company-check-guide | 応募手続き | 統合候補 | hoikushi-job-posting-official-info-compare | 652 | 0 | 1 | 2026-09-30 | 「公式情報で確かめる」という同じ意図。518〜652字と薄い／勤務地の記述を2園に修正済み |
| P2 | nurse-fulltime-nursery-job-guide | 看護師（保育士枠） | 統合先 |  | 818 | 5 | 2 | 2026-10-12 | 勤務地の記述を2園に修正済み |
| P2 | nurse-parttime-nursery-job-guide | 看護師（保育士枠） | 統合候補 | nurse-fulltime-nursery-job-guide | 674 | 4 | 2 | 2026-09-21 | 正社員版と類似度0.43〜0.59。「看護師 保育園 求人」の働き方として1本にまとめる |
| P3 | denentoshi-line-hoikushi-job-guide | エリア | 維持 |  | 970 | 1 | 1 | 2026-09-15 | 勤務地の記述を2園に修正済み |
| P3 | komazawa-hoikushi | エリア | 維持 |  | 730 | 1 | 2 | 2026-09-09 |  |
| P3 | sangenjaya-hoikushi-commute-guide | エリア | 維持 |  | 1061 | 6 | 2 | 2026-09-18 | 勤務地の記述を2園に修正済み |
| P3 | setagaya-hoikushi-job-guide | エリア | 維持 |  | 948 | 1 | 0 | 2026-09-09 |  |
| P3 | umegaoka-hoikushi | エリア | 維持 |  | 748 | 0 | 2 | 2026-09-09 |  |
| P3 | early-career-hoikushi-komazawa | 保育士｜キャリア・復職 | 維持 |  | 924 | 1 | 2 | 2026-09-12 | 勤務地の記述を2園に修正済み |
| P3 | hoikushi-careerup-manager-candidate | 保育士｜キャリア・復職 | 維持 |  | 1058 | 3 | 2 | 2026-09-19 |  |
| P3 | hoikushi-recruitment-schedule-when-to-apply | 保育士｜キャリア・復職 | 維持 |  | 969 | 3 | 3 | 2026-09-23 |  |
| P3 | midyear-hoikushi-job-change-guide | 保育士｜キャリア・復職 | 維持 |  | 1043 | 3 | 2 | 2026-09-15 |  |
| P3 | new-graduate-hoikushi-small-nursery | 保育士｜キャリア・復職 | 維持 |  | 1066 | 2 | 2 | 2026-09-19 |  |
| P3 | childcare-work-balance-nursery-job | 保育士｜働き方 | 維持 |  | 1084 | 5 | 1 | 2026-09-14 | 勤務地の記述を2園に修正済み |
| P3 | early-shift-hoikushi-komazawa-guide | 保育士｜働き方 | 維持 |  | 1022 | 0 | 2 | 2026-09-20 |  |
| P3 | employee-childcare-slot-hoikushi-work-guide | 保育士｜働き方 | 維持 |  | 1145 | 6 | 1 | 2026-09-24 |  |
| P3 | fulltime-hoikushi-komazawa | 保育士｜働き方 | 維持 |  | 634 | 2 | 1 | 2026-09-11 |  |
| P3 | hoikushi-fulltime-vs-parttime-guide | 保育士｜働き方 | 維持 |  | 1203 | 4 | 2 | 2026-09-16 | 勤務地の記述を2園に修正済み |
| P3 | nursery-shift-hours-check-guide | 保育士｜働き方 | 維持 |  | 1000 | 4 | 2 | 2026-09-14 | 勤務地の記述を2園に修正済み |
| P3 | part-time-hoikushi-komazawa | 保育士｜働き方 | 維持 |  | 605 | 3 | 1 | 2026-09-11 |  |
| P3 | weekend-open-nursery-job-guide | 保育士｜働き方 | 維持 |  | 599 | 1 | 1 | 2026-09-10 |  |
| P3 | hoikushi-application-motivation-guide | 保育士｜書類 | 維持 |  | 953 | 2 | 2 | 2026-09-13 |  |
| P3 | hoikushi-resume-career-history-guide | 保育士｜書類 | 維持 |  | 1118 | 1 | 2 | 2026-09-15 |  |
| P3 | hoikushi-self-pr-child-perspective-guide | 保育士｜書類 | 維持 |  | 1054 | 3 | 2 | 2026-09-18 |  |
| P3 | hoikushi-transportation-allowance-commute-cost-guide | 保育士｜条件の確認 | 維持 |  | 1020 | 4 | 2 | 2026-09-20 |  |
| P3 | hoikushi-weekly-two-days-off-job-guide | 保育士｜条件の確認 | 維持 |  | 983 | 3 | 2 | 2026-09-17 |  |
| P3 | hoikushi-interview-clothes-belongings-guide | 保育士｜面接 | 維持 |  | 1174 | 8 | 2 | 2026-09-17 | 勤務地の記述を2園に修正済み |
| P3 | hoikushi-interview-common-questions | 保育士｜面接 | 維持 |  | 1090 | 3 | 2 | 2026-09-15 |  |
| P3 | hoikushi-interview-reverse-questions | 保育士｜面接 | 維持 |  | 1031 | 2 | 2 | 2026-09-14 |  |
| P3 | hoikushi-interview-schedule-email-guide | 保育士｜面接 | 維持 |  | 825 | 3 | 2 | 2026-10-06 |  |
| P3 | hoikushi-job-change-reason-interview-guide | 保育士｜面接 | 維持 |  | 1056 | 1 | 2 | 2026-09-17 |  |
| P3 | hoikushi-joining-date-while-employed-guide | 保育士｜面接 | 維持 |  | 602 | 3 | 2 | 2026-10-17 |  |
| P3 | hoikushi-piano-skill-interview-check-guide | 保育士｜面接 | 維持 |  | 1245 | 4 | 2 | 2026-10-16 |  |
| P3 | hoiku-assistant-to-hoikushi-career-path | 保育補助｜キャリア | 維持 |  | 1021 | 4 | 1 | 2026-09-15 |  |
| P3 | double-work-hoiku-assistant-guide | 保育補助｜働き方 | 維持 |  | 997 | 4 | 2 | 2026-09-19 |  |
| P3 | fulltime-hoiku-assistant-komazawa | 保育補助｜働き方 | 維持 |  | 922 | 1 | 2 | 2026-09-12 | 勤務地の記述を2園に修正済み |
| P3 | hoiku-assistant-fulltime-vs-parttime-guide | 保育補助｜働き方 | 維持 |  | 1211 | 3 | 2 | 2026-09-16 |  |
| P3 | hoiku-assistant-holiday-leave-guide | 保育補助｜働き方 | 維持 |  | 673 | 4 | 2 | 2026-10-12 | 調理版（nursery-cook-holiday-leave-guide）と文章類似度0.61。職種が違うので統合はしないが、定型文を減らす |
| P3 | late-shift-hoiku-assistant-komazawa | 保育補助｜働き方 | 維持 |  | 1117 | 5 | 2 | 2026-09-19 |  |
| P3 | part-time-hoiku-assistant-komazawa | 保育補助｜働き方 | 維持 |  | 895 | 3 | 2 | 2026-09-13 | 勤務地の記述を2園に修正済み |
| P3 | part-time-hoikushi-fuyou-check-guide | 保育補助｜働き方 | 維持 |  | 658 | 3 | 2 | 2026-09-21 |  |
| P3 | student-hoiku-assistant-parttime-job-guide | 保育補助｜働き方 | 維持 |  | 522 | 4 | 2 | 2026-10-17 |  |
| P3 | hoiku-assistant-guide | 保育補助｜入門・無資格 | 維持 |  | 894 | 2 | 2 | 2026-09-09 |  |
| P3 | hoikushi-vs-hoiku-assistant-job-choice | 保育補助｜入門・無資格 | 維持 |  | 999 | 3 | 2 | 2026-09-14 | 勤務地の記述を2園に修正済み |
| P3 | no-qualification-hoiku-assistant-komazawa | 保育補助｜入門・無資格 | 維持 |  | 932 | 2 | 2 | 2026-09-13 | 勤務地の記述を2園に修正済み |
| P3 | nozawa-hoiku-assistant-job-guide | 保育補助｜入門・無資格 | 維持 |  | 978 | 2 | 2 | 2026-09-18 | エリア記事としては「野沢」の需要次第。GSC で表示がなければ no-qualification-hoiku-assistant-komazawa へ統合候補 |
| P3 | hoiku-assistant-application-motivation-noqualification | 保育補助｜書類・面接 | 維持 |  | 1008 | 0 | 3 | 2026-09-23 | 勤務地の記述を2園に修正済み |
| P3 | hoiku-assistant-interview-preparation-guide | 保育補助｜書類・面接 | 維持 |  | 1106 | 3 | 2 | 2026-09-18 | 勤務地の記述を2園に修正済み |
| P3 | hoiku-assistant-interview-reverse-questions-guide | 保育補助｜書類・面接 | 維持 |  | 1258 | 5 | 2 | 2026-09-24 | 勤務地の記述を2園に修正済み |
| P3 | hoiku-assistant-resume-career-guide | 保育補助｜書類・面接 | 維持 |  | 1347 | 3 | 2 | 2026-09-22 |  |
| P3 | hoiku-assistant-self-pr-guide | 保育補助｜書類・面接 | 維持 |  | 1280 | 0 | 2 | 2026-09-22 |  |
| P3 | babysitter-experience-hoiku-assistant | 保育補助｜経験の生かし方 | 維持 |  | 968 | 2 | 2 | 2026-09-12 | 勤務地の記述を2園に修正済み |
| P3 | childcare-experience-hoiku-assistant-career | 保育補助｜経験の生かし方 | 維持 |  | 1039 | 1 | 2 | 2026-09-17 | 勤務地の記述を2園に修正済み |
| P3 | hoiku-assistant-40s-50s-career-start-guide | 保育補助｜経験の生かし方 | 維持 |  | 650 | 4 | 2 | 2026-10-17 |  |
| P3 | hoiku-assistant-from-sales-office-work-guide | 保育補助｜経験の生かし方 | 維持 |  | 1020 | 6 | 2 | 2026-10-08 | 勤務地の記述を2園に修正済み |
| P3 | kindergarten-teacher-hoiku-assistant-career | 保育補助｜経験の生かし方 | 維持 |  | 1066 | 3 | 2 | 2026-09-23 | 勤務地の記述を2園に修正済み |
| P3 | child-led-care-hoikushi | 園の特徴 | 維持 |  | 586 | 1 | 0 | 2026-09-10 |  |
| P3 | company-led-nursery-hoikushi-job | 園の特徴 | 維持 |  | 585 | 1 | 1 | 2026-09-10 |  |
| P3 | infant-care-career | 園の特徴 | 維持 |  | 773 | 0 | 2 | 2026-09-09 |  |
| P3 | nursery-tour-job-change-checklist | 応募手続き | 維持 |  | 1014 | 3 | 2 | 2026-09-12 |  |
| P3 | recruit-before-application-inquiry-guide | 応募手続き | 維持 |  | 772 | 3 | 2 | 2026-10-10 | 勤務地の記述を2園に修正済み |
| P3 | nurse-nursery-application-motivation-guide | 看護師（保育士枠） | 維持 |  | 1365 | 3 | 2 | 2026-09-22 | 採用ページでは看護師は「保育士」の応募資格。看護師としての別職種募集かは要確認／勤務地の記述を2園に修正済み |
| P3 | nurse-nursery-health-observation-role-guide | 看護師（保育士枠） | 維持 |  | 706 | 4 | 2 | 2026-10-13 | 採用ページでは看護師は「保育士」の応募資格。看護師としての別職種募集かは要確認／勤務地の記述を2園に修正済み |
| P3 | nurse-nursery-interview-role-check-guide | 看護師（保育士枠） | 維持 |  | 1034 | 6 | 3 | 2026-09-23 | 採用ページでは看護師は「保育士」の応募資格。看護師としての別職種募集かは要確認／勤務地の記述を2園に修正済み |
| P3 | nurse-nursery-return-after-break-guide | 看護師（保育士枠） | 維持 |  | 757 | 3 | 2 | 2026-10-06 | 採用ページでは看護師は「保育士」の応募資格。看護師としての別職種募集かは要確認 |
| P3 | nurse-qualification-nursery-care | 看護師（保育士枠） | 維持 |  | 620 | 2 | 1 | 2026-09-11 | 採用ページでは看護師は「保育士」の応募資格。看護師としての別職種募集かは要確認／勤務地の記述を2園に修正済み |
| P3 | nurse-resume-nursery-job-guide | 看護師（保育士枠） | 維持 |  | 1149 | 5 | 2 | 2026-09-24 | 採用ページでは看護師は「保育士」の応募資格。看護師としての別職種募集かは要確認 |
| 保留 | fulltime-nursery-cooking-staff-guide | 調理（保留） | 保留 |  | 742 | 3 | 2 | 2026-09-21 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | komazawa-nursery-cook-job-guide | 調理（保留） | 保留 |  | 1196 | 7 | 2 | 2026-09-22 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-allergy-meal-role-guide | 調理（保留） | 統合候補（保留） | nursery-cook-daily-flow-check-guide | 540 | 6 | 1 | 2026-10-15 | 募集継続が確認できたら統合 |
| 保留 | nursery-cook-application-motivation-guide | 調理（保留） | 保留 |  | 1024 | 2 | 3 | 2026-09-23 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-daily-flow-check-guide | 調理（保留） | 保留 |  | 734 | 5 | 2 | 2026-10-10 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-experience-preferred-guide | 調理（保留） | 統合候補（保留） | nursery-cook-qualification-required-check-guide | 684 | 5 | 2 | 2026-10-04 | 募集継続が確認できたら統合 |
| 保留 | nursery-cook-food-safety-records-role-guide | 調理（保留） | 統合候補（保留） | nursery-cook-daily-flow-check-guide | 1233 | 5 | 2 | 2026-10-16 | 募集継続が確認できたら統合 |
| 保留 | nursery-cook-holiday-leave-guide | 調理（保留） | 保留 |  | 653 | 6 | 2 | 2026-10-12 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-interview-check-guide | 調理（保留） | 保留 |  | 1383 | 10 | 2 | 2026-09-22 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-menu-ordering-duties-guide | 調理（保留） | 統合候補（保留） | nursery-cook-daily-flow-check-guide | 706 | 5 | 2 | 2026-10-13 | 募集継続が確認できたら統合 |
| 保留 | nursery-cook-noexperience-guide | 調理（保留） | 保留 |  | 1208 | 5 | 2 | 2026-09-16 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-plating-serving-cleanup-role-guide | 調理（保留） | 統合候補（保留） | nursery-cook-daily-flow-check-guide | 1260 | 6 | 2 | 2026-10-18 | 募集継続が確認できたら統合 |
| 保留 | nursery-cook-qualification-allowance-check-guide | 調理（保留） | 統合候補（保留） | nursery-cook-qualification-required-check-guide | 1183 | 9 | 2 | 2026-09-24 | 募集継続が確認できたら統合 |
| 保留 | nursery-cook-qualification-required-check-guide | 調理（保留） | 保留 |  | 705 | 4 | 2 | 2026-10-10 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-resume-career-history-guide | 調理（保留） | 保留 |  | 1217 | 3 | 2 | 2026-09-24 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-return-after-career-break-guide | 調理（保留） | 保留 |  | 604 | 5 | 2 | 2026-10-17 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cook-transportation-allowance-guide | 調理（保留） | 保留 |  | 674 | 3 | 2 | 2026-10-12 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | nursery-cooking-staff-setagaya | 調理（保留） | 統合候補（保留） | komazawa-nursery-cook-job-guide | 606 | 1 | 1 | 2026-09-11 | 募集継続が確認できたら統合 |
| 保留 | nutritionist-cook-nursery-career | 調理（保留） | 保留 |  | 813 | 3 | 1 | 2026-09-13 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | part-time-nursery-cooking-staff | 調理（保留） | 保留 |  | 1018 | 4 | 2 | 2026-09-14 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
| 保留 | umegaoka-nursery-cook-infant-food | 調理（保留） | 保留 |  | 1110 | 5 | 2 | 2026-09-19 | 調理スタッフの募集が今もあるか要確認。採用ページ（hoiku）に調理の募集が無いため、確認できるまで手を入れない |
