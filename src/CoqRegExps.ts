const key_region_start = "Section|Module Type|Module";
const key_region_end = "End";
// theorems need to be closed by key_thm_end
const key_theorem = "Theorem|Lemma|Remark|Fact|Corollary|Property|Proposition|Goal";
const key_thm_end = "(Qed|Admitted|Abort|Defined)\\.";
// belows need to be closed by key_def_end
const key_definition = "Program Definition|Program Fixpoint|Program CoFixpoint|Program Function|Function|CoFixpoint|Fixpoint|Definition|Example|Let";
const key_inductive = "CoInductive|Inductive";
const key_class = "Class";
const key_record = "Record";
const key_ltac = "Ltac";
const key_assumption_plural = "Parameters|Axioms|Conjectures|Variables|Hypotheses";
const key_assumption_singular = "Parameter|Axiom|Conjecture|Variable|Hypothesis";
const key_assumption = key_assumption_plural + "|" + key_assumption_singular;
const key_def_end = "\\.";
const key_with = "with";
const ident = "[a-zA-Z_][a-zA-Z0-9_']*";
const idents = "([a-zA-Z_][a-zA-Z0-9_'\\s]*)*";
const idents_with_parenth = "\\(\\s*[a-zA-Z_][a-z-A-Z0-9_'\\s]*:";

export const reg_key = RegExp("^(" + [
                    key_region_start, key_region_end, key_definition, key_inductive,
                    key_theorem, key_class, key_record, key_ltac, key_assumption, key_with
                ].join('|') + ")\\s+");
// included in key
export const reg_key_region_start = RegExp("(" + key_region_start + ")");
export const reg_key_region_end = RegExp("(" + key_region_end + ")");
export const reg_key_definition = RegExp("(" + [key_definition, key_inductive].join('|') + ")");
export const reg_key_theorem = RegExp("(" + key_theorem + ")");
export const reg_key_class = RegExp("(" + key_class + ")");
export const reg_key_record = RegExp("(" + key_record + ")");
export const reg_key_ltac = RegExp("(" + key_ltac + ")");
export const reg_key_assumption_singular = RegExp("(" + key_assumption_singular + ")");
export const reg_key_assumption_plural = RegExp("(" + key_assumption_plural + ")");
export const reg_key_with = RegExp("(" + key_with + ")");
export const reg_key_inductive = RegExp("(" + key_inductive + ")");
// not included in key
export const reg_key_def_end = RegExp("(" + key_def_end + ")$");
export const reg_key_thm_end = RegExp("(" + key_thm_end + ")$");

export const reg_ident = RegExp("(" + ident + ")");
export const reg_idents = RegExp("(" + idents + ")");
export const reg_idents_with_parenth = RegExp("(" + idents_with_parenth + ")", "g");

export const reg_field = RegExp("(^" + ident + ")");
export const reg_field_end = RegExp(";$");

export const reg_inductive_item = RegExp("(\\s+\\|\\s*" + ident + ")|(^\\|\\s*" + ident + ")", 'g');

export const reg_comment_l = /\(\*/g;
export const reg_comment_r = /([^\(]\*\))|(^\*\))/g;
export const reg_comment = /(\(\*)|(\*\))/g;
