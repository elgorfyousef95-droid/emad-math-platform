const memoryKey = "emad-yousef-ai-memory-v1";

const knowledge = [
  { keys: ["قانون نيوتن الأول", "قانون القصور الذاتي"], answer: "قانون نيوتن الأول بيقول إن الجسم يفضل ساكن أو يتحرك بسرعة ثابتة في خط مستقيم ما لم تؤثر عليه محصلة قوة خارجية تغيّر حالته الحركية." },
  { keys: ["قانون نيوتن الثاني"], answer: "قانون نيوتن الثاني: محصلة القوى المؤثرة على جسم تساوي كتلة الجسم مضروبة في عجلته، رياضيًا ΣF = m a. لازم تكون الوحدات بالنظام الدولي: نيوتن، كيلوجرام، متر لكل ثانية تربيع." },
  { keys: ["قانون نيوتن الثالث"], answer: "قانون نيوتن الثالث: لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه، والقوتان تؤثران في جسمين مختلفين." },
  { keys: ["المشتقة", "التفاضل"], answer: "المشتقة بتقيس معدل التغير اللحظي للدالة. مثلًا مشتقة x² هي 2x، وده معناه إن ميل المنحنى عند أي قيمة x يساوي 2x." },
  { keys: ["التكامل"], answer: "التكامل عكس عملية الاشتقاق في حالات كثيرة، وبيُستخدم لإيجاد المساحات والتغير الكلي. مثلًا ∫x² dx = x³/3 + C." },
  { keys: ["قانون أوم"], answer: "قانون أوم بيربط الجهد والتيار والمقاومة: V = I × R، بشرط ثبات الظروف الفيزيائية للموصل." },
  { keys: ["السرعة المتجهة"], answer: "السرعة المتجهة هي معدل تغير الإزاحة بالنسبة للزمن، وليها مقدار واتجاه. متوسط السرعة المتجهة = الإزاحة ÷ الزمن." },
  { keys: ["العجلة", "التسارع"], answer: "العجلة هي معدل تغير السرعة المتجهة بالنسبة للزمن، ووحدتها متر لكل ثانية تربيع." }
];

function readMemory() {
  try { return JSON.parse(localStorage.getItem(memoryKey) || "[]"); } catch { return []; }
}
function saveMemory(items) {
  try { localStorage.setItem(memoryKey, JSON.stringify(items.slice(-24))); } catch {}
}

export function generateYousefReply(rawText) {
  const text = String(rawText || "").trim();
  const lower = text.toLowerCase();
  if (!text) return "اكتب سؤالك أو اتكلم وأنا هحاول أساعدك.";
  let answer = "";
  if (/^(السلام عليكم|سلام عليكم)/.test(text)) answer = "وعليكم السلام ورحمة الله! أهلًا بيك، تحب نشتغل على إيه؟";
  else if (/(^|\s)(أهلا|اهلا|مرحبا|هاي|hello|hi)(\s|$)/i.test(text)) answer = "أهلًا بيك! أنا يوسف AI، أقدر أساعدك في الأسئلة التعليمية والحسابات والمعلومات المتاحة عندي.";
  else if (/(اسمك|مين انت|من أنت)/.test(text)) answer = "أنا يوسف AI، المساعد التعليمي الخاص بالمنصة. النسخة الحالية بتعتمد على قاعدة معرفة محلية وقواعد فهم محددة، ولسه بنوسّع قدراتها.";
  else if (/(افتكر|فاكر|تذكر)/.test(text)) {
    const recent = readMemory().slice(-3).map(x => x.user).filter(Boolean);
    answer = recent.length ? "من آخر كلام محفوظ عندي: " + recent.join("؛ ") : "لسه مفيش تفاصيل سابقة محفوظة في ذاكرة المحادثة دي.";
  } else {
    const item = knowledge.find(entry => entry.keys.some(key => lower.includes(key.toLowerCase())));
    if (item) answer = item.answer;
  }
  if (!answer) {
    const arithmetic = text.match(/(?:احسب|ناتج|يساوي)\s*([0-9٠-٩۰-۹().+\-*/×÷^ ]+)/);
    if (arithmetic) {
      const expression = arithmetic[1].replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/×/g,"*").replace(/÷/g,"/");
      if (/^[\d().+\-*/^ ]+$/.test(expression)) {
        try {
          const tokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/^]/g) || [];
          if (tokens.join("") === expression.replace(/\s/g,"")) {
            let i=0; const primary=()=>{const t=tokens[i++];if(t==="("){const v=expr();if(tokens[i++]!==")")throw Error();return v;}if(t==="-")return -primary();if(t==="+")return primary();const n=Number(t);if(!Number.isFinite(n))throw Error();return n;};
            const power=()=>{let v=primary();if(tokens[i]==="^"){i++;v=v**power();}return v;};
            const term=()=>{let v=power();while(tokens[i]==="*"||tokens[i]==="/"){const op=tokens[i++],n=power();v=op==="*"?v*n:v/n;}return v;};
            const expr=()=>{let v=term();while(tokens[i]==="+"||tokens[i]==="-"){const op=tokens[i++],n=term();v=op==="+"?v+n:v-n;}return v;};
            const result=expr();if(i===tokens.length&&Number.isFinite(result))answer="الناتج = "+Number(result.toPrecision(12));
          }
        } catch {}
      }
    }
  }
  if (!answer && /(ساعدني|اشرح|يعني ايه|ما هو|ما هي|عرف|حل)/.test(text)) {
    answer = "خليني أساعدك. ممكن تبعت السؤال كامل أو تكتب اسم الدرس والجزء اللي واقف معاك فيه؟ قاعدة المعرفة المحلية عندي لسه بتتوسع، فلو الموضوع خارج المعلومات المتاحة هقولك بصراحة بدل ما أخمّن.";
  }
  if (!answer) answer = "فهمت إنك بتقول: «" + text + "». المعلومة دي مش موجودة حاليًا في قاعدة المعرفة المحلية عندي. أقدر أتعامل مع أسئلة الرياضيات والفيزياء الأساسية والمعلومات المضافة، لكن مش هادّعي فهمًا عامًا بمستوى نموذج لغوي كبير.";
  const history = readMemory();
  history.push({ user: text, assistant: answer, at: Date.now() });
  saveMemory(history);
  return answer;
}
