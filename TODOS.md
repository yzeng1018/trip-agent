# TODOS

## P2 — 预订功能后续

### [booking] 携程联盟佣金追踪
**What:** 在所有携程深链里加入联盟参数 (`?allianceid=xxx&sid=xxx`)。
**Why:** 现在是免费给携程导流，注册携程联盟后每单机票约 ¥10-30，酒店约订单金额 2-5%。
**Context:** `lib/booking.ts` 的 `buildBookingUrl()` 函数统一生成所有携程链接，加参数只需在那里改一行。需要先到 https://www.ctrip.com/alliance/ 注册联盟账号拿到 allianceid 和 sid。
**Effort:** S（人工: 1天 / CC: 15分钟）
**Depends on:** 先完成预订深链功能（booking-deep-links PR）

### [booking] TripConfirmForm 加日期输入字段
**What:** 在确认表单里加「出发日期」选择器。
**Why:** 用户说了「4月15日」但表单只记录「7天」，导致深链缺少日期参数，用户到携程还要再选日期。有具体日期可以直接落到特定日期的搜索结果页。
**Context:** `TripConfirmForm` 在 `app/results/page.tsx`。需要在 `TripFormData` 类型里加 `departDate?: string`，表单 UI 加日期选择器（可以用 `<input type="date">`），并在 `buildBookingUrl()` 里使用。
**Effort:** M（人工: 2天 / CC: 20分钟）
**Depends on:** 先完成预订深链功能
