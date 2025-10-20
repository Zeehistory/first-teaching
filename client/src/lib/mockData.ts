import type { BookData } from "@shared/schema";

export const mockBookData: BookData = {
  title: "The Pursuit of Divine Wisdom",
  subtitle: "A Philosophical Journey Through Classical Islamic Thought",
  introduction: "This digital companion provides extended discussions and detailed commentary on topics introduced in the physical book. Each chapter here expands upon the foundational concepts presented in print, offering deeper insights for the curious reader.",
  chapters: [
    {
      id: "ch1",
      number: 1,
      title: "The Nature of Knowledge",
      description: "An exploration of epistemology in classical Islamic philosophy",
      sections: [
        {
          id: "ch1-s1",
          title: "Introduction to Knowledge",
          pageReference: 12,
          content: `The pursuit of knowledge has long been considered one of the highest callings in Islamic tradition. The Prophet Muhammad (peace be upon him) famously stated, "Seeking knowledge is an obligation upon every Muslim."<sup data-footnote="1">1</sup> This profound directive has shaped Islamic civilization's approach to learning for over fourteen centuries.

In the classical period, Muslim philosophers distinguished between various types of knowledge. Al-Ghazali, in his seminal work *Ihya Ulum al-Din*, categorized knowledge into that which is obligatory (fard) and that which is recommended (mandub).<sup data-footnote="2">2</sup> This distinction was not merely academic but had practical implications for how scholars allocated their time and resources.

The epistemological framework developed by these thinkers continues to influence contemporary Islamic thought. Understanding their methodology provides insight into how knowledge was acquired, validated, and transmitted across generations.`,
          footnotes: [
            {
              id: "fn1",
              number: 1,
              sectionId: "ch1-s1",
              content: "This hadith is reported in Sunan Ibn Majah and other collections. While some scholars debate its chain of transmission, its meaning is widely accepted and supported by numerous Quranic verses emphasizing the importance of knowledge, such as 'Are those who know equal to those who do not know?' (Quran 39:9)"
            },
            {
              id: "fn2",
              number: 2,
              sectionId: "ch1-s1",
              content: "Abu Hamid al-Ghazali (1058-1111 CE) was one of the most influential Islamic theologians and philosophers. His *Ihya Ulum al-Din* (Revival of the Religious Sciences) remains a cornerstone text in Islamic scholarship. For more on his epistemology, see the extended discussion in Chapter 3 of this companion."
            }
          ]
        },
        {
          id: "ch1-s2",
          title: "Sources of Knowledge in Islamic Tradition",
          pageReference: 18,
          content: `Islamic epistemology recognizes multiple valid sources of knowledge, each with its proper domain and methodology. The primary sources include revelation (wahy), reason (aql), and sensory experience (tajribah).<sup data-footnote="3">3</sup>

Revelation, as transmitted through the Quran and authentic prophetic traditions, provides knowledge of the divine will and ultimate truths beyond human capacity to discover independently. Reason, considered a divine gift, enables humans to understand and apply revealed knowledge, as well as to discover truths about the natural world.

The relationship between revelation and reason has been a central topic of philosophical discourse. Ibn Rushd (Averroes) argued that properly understood, revelation and reason cannot contradict each other, as both emanate from the same divine source.<sup data-footnote="4">4</sup> This harmonious view, however, was contested by other schools of thought.`,
          footnotes: [
            {
              id: "fn3",
              number: 3,
              sectionId: "ch1-s2",
              content: "This tripartite division is particularly emphasized in the Ash'arite school of theology. Other traditions, such as the Mu'tazilite school, placed greater emphasis on reason as the primary arbiter of truth, even in theological matters."
            },
            {
              id: "fn4",
              number: 4,
              sectionId: "ch1-s2",
              content: "Ibn Rushd's *Decisive Treatise* (Fasl al-Maqal) addresses this question directly. He argues that philosophy and revealed law are 'milk-siblings' - both drawing from the same source of truth. For a detailed analysis of his argument and its historical reception, see the physical book pages 45-52."
            }
          ]
        }
      ]
    },
    {
      id: "ch2",
      number: 2,
      title: "The Cosmos and Divine Order",
      description: "Understanding the natural world through a philosophical lens",
      sections: [
        {
          id: "ch2-s1",
          title: "The Concept of Tawhid in Cosmology",
          pageReference: 67,
          content: `The Islamic principle of tawhid (divine unity) extends far beyond theological doctrine into cosmological understanding. Muslim philosophers saw the universe not as a random collection of phenomena but as an integrated whole reflecting divine wisdom and order.<sup data-footnote="5">5</sup>

This holistic view influenced scientific inquiry, as natural philosophers sought to uncover the patterns and laws that govern creation. The regularity observed in nature was understood as a sign (ayah) pointing to the singular divine source.

Ibn al-Haytham's work in optics, Al-Biruni's geographical studies, and Ibn Sina's medical texts all proceeded from this fundamental assumption: that the natural world operates according to discoverable, rational principles established by the Creator.`,
          footnotes: [
            {
              id: "fn5",
              number: 5,
              sectionId: "ch2-s1",
              content: "The Quranic verse 'We shall show them Our signs in the horizons and within themselves' (41:53) was frequently cited by natural philosophers as justification for empirical investigation of the cosmos. This verse provided theological support for what we would now call scientific research."
            }
          ]
        }
      ]
    },
    {
      id: "ch3",
      number: 3,
      title: "Ethics and Human Flourishing",
      description: "The path to virtue and moral excellence",
      sections: [
        {
          id: "ch3-s1",
          title: "Aristotelian Ethics in Islamic Philosophy",
          pageReference: 103,
          content: `The incorporation of Aristotelian ethical theory into Islamic philosophy represents one of the most successful examples of cross-cultural intellectual exchange. Muslim philosophers, particularly Ibn Miskawayh and Al-Farabi, adapted Aristotle's concept of eudaimonia (human flourishing) to align with Islamic values and objectives.<sup data-footnote="6">6</sup>

Al-Farabi's *Attainment of Happiness* outlines a vision of human perfection that synthesizes Greek philosophical ideals with Islamic teachings. He argues that true happiness is achieved through the development of rational and moral virtues, culminating in knowledge of divine realities.

This philosophical framework provided a sophisticated approach to ethics that went beyond mere rule-following, emphasizing character development and the cultivation of excellence in all aspects of life.`,
          footnotes: [
            {
              id: "fn6",
              number: 6,
              sectionId: "ch3-s1",
              content: "For a comprehensive comparison of Aristotelian and Islamic ethical frameworks, including how Muslim philosophers transformed Greek concepts to fit within an Islamic worldview, refer to the extended analysis beginning on page 103 of the physical book."
            }
          ]
        }
      ]
    }
  ]
};
