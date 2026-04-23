"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApiSuccess = exports.RISK_THRESHOLDS = exports.mkConfidence = exports.mkRiskScore = exports.mkAmountMinor = exports.mkModelVersion = exports.mkAnalysisId = exports.mkReportId = exports.mkRuleId = exports.mkMerchantId = exports.mkAccountId = exports.mkUserId = exports.mkTransactionId = void 0;
exports.scoreToRiskLevel = scoreToRiskLevel;
const mkTransactionId = (s) => s;
exports.mkTransactionId = mkTransactionId;
const mkUserId = (s) => s;
exports.mkUserId = mkUserId;
const mkAccountId = (s) => s;
exports.mkAccountId = mkAccountId;
const mkMerchantId = (s) => s;
exports.mkMerchantId = mkMerchantId;
const mkRuleId = (s) => s;
exports.mkRuleId = mkRuleId;
const mkReportId = (s) => s;
exports.mkReportId = mkReportId;
const mkAnalysisId = (s) => s;
exports.mkAnalysisId = mkAnalysisId;
const mkModelVersion = (s) => s;
exports.mkModelVersion = mkModelVersion;
const mkAmountMinor = (n) => {
    if (!Number.isInteger(n) || n < 0)
        throw new RangeError(`Invalid minor amount: ${n}`);
    return n;
};
exports.mkAmountMinor = mkAmountMinor;
const mkRiskScore = (n) => {
    return Math.max(0, Math.min(100, Math.round(n)));
};
exports.mkRiskScore = mkRiskScore;
const mkConfidence = (n) => {
    if (n < 0 || n > 1)
        throw new RangeError(`Confidence out of range: ${n}`);
    return n;
};
exports.mkConfidence = mkConfidence;
exports.RISK_THRESHOLDS = {
    low: { min: 0, max: 30 },
    medium: { min: 31, max: 60 },
    high: { min: 61, max: 85 },
    critical: { min: 86, max: 100 }
};
function scoreToRiskLevel(score) {
    if (score <= 30)
        return 'low';
    if (score <= 60)
        return 'medium';
    if (score <= 85)
        return 'high';
    return 'critical';
}
const isApiSuccess = (r) => r.success;
exports.isApiSuccess = isApiSuccess;
//# sourceMappingURL=types.js.map