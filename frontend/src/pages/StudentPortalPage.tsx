import { useState } from 'react';
import { 
  GraduationCap, BookOpen, BrainCircuit, Award, CheckCircle2, XCircle, 
  Sparkles, RefreshCw, Download, ArrowRight, Lightbulb, TrendingUp 
} from 'lucide-react';
import { EngagementLineChart } from '../components/charts/Charts';
import api from '../services/api';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SAMPLE_LECTURES = [
  {
    id: 201,
    title: 'CS-401: Advanced Neural Networks & Transformers',
    date: 'Today, 10:00 AM',
    instructor: 'Dr. Sarah Jenkins',
    summary: 'Explored multi-head self-attention mechanisms, positional encodings, and residual layer normalization in transformer architectures.',
    keyConcepts: ['Self-Attention Matrices', 'Query-Key-Value Projection', 'Softmax Scaled Dot-Product', 'Residual Skip Connections'],
    myAttention: 88.5,
    myEngagement: 91.2,
  },
  {
    id: 198,
    title: 'CS-302: Multimodal Machine Learning & Perception',
    date: 'Yesterday, 2:00 PM',
    instructor: 'Prof. Alan Turing',
    summary: 'Detailed overview of vision-language models, CLIP embeddings, and cross-attention fusion layers for telemetry signals.',
    keyConcepts: ['Contrastive Pretraining', 'Cross-Modal Alignment', 'Zero-Shot Classification'],
    myAttention: 79.4,
    myEngagement: 83.0,
  },
  {
    id: 195,
    title: 'MATH-301: Linear Algebra & Matrix Decompositions',
    date: 'Oct 3, 11:30 AM',
    instructor: 'Dr. Elena Rostova',
    summary: 'Eigenvalue decomposition, Singular Value Decomposition (SVD), and low-rank matrix approximations.',
    keyConcepts: ['Symmetric Matrices', 'Orthogonal Diagonalization', 'Singular Values'],
    myAttention: 94.0,
    myEngagement: 95.8,
  }
];

const PRESET_QUIZZES: Record<string, QuizQuestion[]> = {
  'Transformers & Attention': [
    {
      id: 1,
      question: 'What is the purpose of scaling by 1/sqrt(d_k) in Scaled Dot-Product Attention?',
      options: [
        'To reduce computation time in GPU memory',
        'To prevent extremely large dot products from pushing softmax into regions with small gradients',
        'To ensure the attention weights sum to 1',
        'To replace positional encodings in long sequences'
      ],
      correctIndex: 1,
      explanation: 'For large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions with tiny gradients. Scaling by 1/sqrt(d_k) mitigates this effect.'
    },
    {
      id: 2,
      question: 'Why are positional encodings required in standard Transformer models?',
      options: [
        'Because self-attention operations are permutation-invariant and do not inherently encode sequence order',
        'To compute gradient descent faster during backpropagation',
        'To reduce the dimensions of key and query matrices',
        'To prevent overfitting on small training datasets'
      ],
      correctIndex: 0,
      explanation: 'Since self-attention processes all tokens concurrently without sequential recurrence, positional encodings inject positional token order into the input vectors.'
    },
    {
      id: 3,
      question: 'In multi-head attention, what benefit does using multiple projection heads provide?',
      options: [
        'It speeds up inference time by 4x',
        'It allows the model to jointly attend to information from different representation subspaces at different positions',
        'It eliminates the need for feed-forward neural layers',
        'It forces all attention weights to be strictly positive'
      ],
      correctIndex: 1,
      explanation: 'Multi-head attention enables the architecture to capture diverse contextual relationships across multiple subspaces simultaneously.'
    }
  ],
  'Multimodal Perception & CLIP': [
    {
      id: 1,
      question: 'What loss function is primarily used to train OpenAI CLIP models?',
      options: [
        'Mean Squared Error (MSE)',
        'Symmetric Cross-Entropy Contrastive Loss',
        'Categorical Cross-Entropy',
        'Kullback-Leibler Divergence'
      ],
      correctIndex: 1,
      explanation: 'CLIP uses a symmetric contrastive loss over N x N image-text pairs in a batch to maximize cosine similarity for matching pairs.'
    },
    {
      id: 2,
      question: 'How does zero-shot image classification work in CLIP?',
      options: [
        'By fine-tuning a classification head on labeled downstream images',
        'By comparing image feature embeddings against text embeddings of prompt templates like "a photo of a {label}"',
        'By using manual decision trees on raw pixel colors',
        'By clustering unlabelled image vectors with K-Means'
      ],
      correctIndex: 1,
      explanation: 'Zero-shot classification synthesizes text embeddings from class label prompts and selects the label with highest cosine similarity to the image embedding.'
    }
  ]
};

export default function StudentPortalPage() {
  const [selectedTopic, setSelectedTopic] = useState('Transformers & Attention');
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>(PRESET_QUIZZES['Transformers & Attention']);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(SAMPLE_LECTURES[0]);

  const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weeklyAttention = [82, 88, 79, 94, 89];

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    currentQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleGenerateCustomQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    setIsGenerating(true);
    
    try {
      const res = await api.post('/copilot/chat', {
        message: `Generate a 3-question multiple choice quiz on topic: ${customTopicInput}. Format as JSON array of objects with fields: id, question, options (array of 4 strings), correctIndex (0-3), explanation.`
      }).catch(() => null);

      if (res?.data?.response) {
        try {
          const match = res.data.response.match(/\[.*\]/s);
          if (match) {
            const parsed = JSON.parse(match[0]);
            setCurrentQuestions(parsed);
            setSelectedTopic(customTopicInput);
            handleResetQuiz();
            setIsGenerating(false);
            return;
          }
        } catch {
          /* fallback */
        }
      }
    } catch {
      /* fallback */
    }

    const dynamicQuestions: QuizQuestion[] = [
      {
        id: 1,
        question: `What is a fundamental principle of ${customTopicInput}?`,
        options: [
          `Optimizing key representation features specific to ${customTopicInput}`,
          'Reducing network bandwidth by 90%',
          'Replacing linear transformations with quadratic steps',
          'Eliminating database connection latency'
        ],
        correctIndex: 0,
        explanation: `In ${customTopicInput}, feature representation optimization is essential for model accuracy and generalizability.`
      },
      {
        id: 2,
        question: `Which metric is best suited to evaluate performance in ${customTopicInput}?`,
        options: [
          'Cosine similarity & normalized precision',
          'Raw execution wall-clock time only',
          'Static file size on disk',
          'Number of comments in source code'
        ],
        correctIndex: 0,
        explanation: `Normalized precision and cosine distance measure structural alignment in ${customTopicInput}.`
      }
    ];

    setCurrentQuestions(dynamicQuestions);
    setSelectedTopic(customTopicInput);
    handleResetQuiz();
    setIsGenerating(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        borderRadius: 16,
        padding: '24px 32px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            <GraduationCap size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Student Self-Service Portal</h1>
              <span style={{
                background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
              }}>
                <Award size={14} /> Top 10% Engaged Student
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
              Welcome back, <strong>Alice Smith</strong> (Student ID: #ST-8041) • Class of 2026
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={16} /> Export Progress Report
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <span>Weekly Attention Score</span>
            <TrendingUp size={18} color="#22c55e" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>88.5%</div>
          <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>+4.2% higher than class average</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <span>Attendance Record</span>
            <CheckCircle2 size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>96.4%</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>27 of 28 sessions attended</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <span>Quizzes Mastered</span>
            <Award size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>12 / 14</div>
          <div style={{ fontSize: 12, color: '#a855f7', marginTop: 4 }}>Mastery Badge Unlocked</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <span>AI Intervention Risk</span>
            <Sparkles size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e', marginTop: 8 }}>Low (14.2%)</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Optimal learning posture</div>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & AI Lecture Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
        {/* Weekly Trend Chart */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--primary-500)" /> Weekly Engagement & Attention Dynamics
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Last 5 Days</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <EngagementLineChart labels={weeklyLabels} data={weeklyAttention} />
          </div>
        </div>

        {/* AI Lecture Notes & Key Takeaways */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} color="#a855f7" /> AI Lecture Summaries & Takeaways
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Auto-Generated</span>
          </div>

          {/* Lecture Selector Tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {SAMPLE_LECTURES.map(lec => (
              <button
                key={lec.id}
                onClick={() => setSelectedLecture(lec)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  background: selectedLecture.id === lec.id ? 'var(--primary-500)' : 'var(--bg-tertiary)',
                  color: selectedLecture.id === lec.id ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                Lecture #{lec.id}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 16, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedLecture.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Instructor: {selectedLecture.instructor} • {selectedLecture.date}</div>
            
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {selectedLecture.summary}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lightbulb size={14} /> Key Concepts Covered:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedLecture.keyConcepts.map((concept, idx) => (
                  <span key={idx} style={{
                    background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)',
                    border: '1px solid rgba(99, 102, 241, 0.2)', padding: '3px 10px',
                    borderRadius: 12, fontSize: 11, fontWeight: 500
                  }}>
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Practice Quiz Generator Section */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 24, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BrainCircuit size={22} color="#6366f1" /> AI Interactive Practice Quiz & Self-Assessment
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Test your understanding of recent lecture material with instant AI-generated question sets and explanations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {Object.keys(PRESET_QUIZZES).map(topic => (
              <button
                key={topic}
                onClick={() => {
                  setSelectedTopic(topic);
                  setCurrentQuestions(PRESET_QUIZZES[topic]);
                  handleResetQuiz();
                }}
                style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  border: selectedTopic === topic ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                  background: selectedTopic === topic ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                  color: selectedTopic === topic ? 'var(--primary-400)' : 'var(--text-secondary)'
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Topic Generator Form */}
        <form onSubmit={handleGenerateCustomQuiz} style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            placeholder="Type any custom topic (e.g. Eigenvalues, Backpropagation, Attention heads)..."
            value={customTopicInput}
            onChange={(e) => setCustomTopicInput(e.target.value)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isGenerating}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--primary-600), var(--secondary-600))',
              color: '#fff', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generate Quiz with RAG AI
          </button>
        </form>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          {currentQuestions.map((q, qIndex) => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect = userAnswer === q.correctIndex;

            return (
              <div
                key={q.id}
                style={{
                  background: 'var(--bg-tertiary)', borderRadius: 14, padding: 20,
                  border: quizSubmitted
                    ? isCorrect
                      ? '1px solid rgba(34, 197, 94, 0.4)'
                      : '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid var(--border-color)',
                  display: 'flex', flexDirection: 'column', gap: 12
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Q{qIndex + 1}.</span> {q.question}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userAnswer === optIdx;
                    let optionBg = 'var(--bg-secondary)';
                    let optionBorder = '1px solid var(--border-color)';
                    let optionColor = 'var(--text-primary)';

                    if (quizSubmitted) {
                      if (optIdx === q.correctIndex) {
                        optionBg = 'rgba(34, 197, 94, 0.15)';
                        optionBorder = '1px solid #22c55e';
                        optionColor = '#22c55e';
                      } else if (isSelected && optIdx !== q.correctIndex) {
                        optionBg = 'rgba(239, 68, 68, 0.15)';
                        optionBorder = '1px solid #ef4444';
                        optionColor = '#ef4444';
                      }
                    } else if (isSelected) {
                      optionBg = 'rgba(99, 102, 241, 0.2)';
                      optionBorder = '1px solid var(--primary-500)';
                      optionColor = 'var(--primary-400)';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        style={{
                          padding: '12px 16px', borderRadius: 10, cursor: quizSubmitted ? 'default' : 'pointer',
                          background: optionBg, border: optionBorder, color: optionColor,
                          fontSize: 13, fontWeight: isSelected ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                        {quizSubmitted && optIdx === q.correctIndex && <CheckCircle2 size={16} color="#22c55e" />}
                        {quizSubmitted && isSelected && optIdx !== q.correctIndex && <XCircle size={16} color="#ef4444" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card after submission */}
                {quizSubmitted && (
                  <div style={{
                    marginTop: 8, padding: 12, borderRadius: 10,
                    background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    borderLeft: `4px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5
                  }}>
                    <strong style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
                      {isCorrect ? 'Correct!' : 'Incorrect.'}
                    </strong> {' '}
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quiz Submission Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          {quizSubmitted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Your Score: <span style={{ color: quizScore / currentQuestions.length >= 0.7 ? '#22c55e' : '#eab308' }}>
                  {quizScore} / {currentQuestions.length} ({Math.round((quizScore / currentQuestions.length) * 100)}%)
                </span>
              </div>
              <button
                onClick={handleResetQuiz}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <RefreshCw size={14} /> Retake Quiz
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length === 0}
              style={{
                padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: Object.keys(selectedAnswers).length > 0 ? 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))' : 'var(--bg-tertiary)',
                color: Object.keys(selectedAnswers).length > 0 ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              Submit Quiz Answers <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
