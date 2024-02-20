export const SPECIAL_TOKENS_ATTRIBUTES = [
	"bos_token",
	"eos_token",
	"unk_token",
	"sep_token",
	"pad_token",
	"cls_token",
	"mask_token",
	// additional_special_tokens (TODO)
] as const;

/**
 * Public interface for a tokenizer's special tokens mapping
 */
export type SpecialTokensMap = {
	[key in (typeof SPECIAL_TOKENS_ATTRIBUTES)[number]]?: string;
};
/**
 * Public interface for tokenizer config
 */
export interface TokenizerConfig extends SpecialTokensMap {
	use_default_system_prompt?: boolean;
	chat_template?: string;
}
