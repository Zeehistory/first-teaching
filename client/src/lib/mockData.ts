import type { BookData } from "@shared/schema";

// TODO: Remove mock data - this will be replaced with actual book content from database/CMS
export const mockBookData: BookData = {
  volumeNumber: 1,
  volumeTitle: "Speaking the Truth with Love",
  seriesTitle: "First Teaching of the Last Message",
  seriesSubtitle: "The Divine Science and Its Six Pillars",
  author: "Umar F. Abd-Allah Wymann-Landgraf",
  introduction: "This digital companion provides extended discussions and detailed commentary referenced in the physical Volume 1. The First Teaching explores the foundational Pillars of Islamic belief and their vast implications for understanding reality, cognition, and the Human condition. Each section here expands upon the scholarly material presented in print, offering deeper insights through extensive footnotes and cross-references.",
  totalVolumes: 18,
  chapters: [
    {
      id: "foreword",
      number: 0,
      title: "Foreword & Preliminaries",
      description: "Introduction to the Teaching, the reader-listener relationship, and biographical context",
      sections: [
        {
          id: "note-to-reader",
          title: "A Note to the Reader",
          pageReference: 3,
          content: `To begin with, this book like many Traditional Islamic texts is written to be read out loud in the presence of readers, listeners, and reader-listeners with the assistance of authorized teachers.<sup data-footnote="1">1</sup> Therefore, instead of just speaking of the reader, I often like to use the term "reader-listener" to refer to the people studying this work.

The First Teaching is a "Teaching." It is not a narrative or just a book. In this work, I present myself—not as an ordinary academic narrator—but as an Educator.<sup data-footnote="2">2</sup> This approach is central to how this work should be understood and engaged with.

Beginnings are all-important, a Principle that I will repeatedly explain and advocate for throughout this book. Even when we have been blessed with good beginnings, we should strive to make new and better ones each day. In this sense, I hope that The First Teaching will be like a "first new and promising day" for each reader-listener, no matter what has gone before.`,
          footnotes: [
            {
              id: "fn1",
              number: 1,
              sectionId: "note-to-reader",
              content: "This pedagogical approach reflects the Traditional Islamic method of transmission, where knowledge is not merely read silently but engaged with actively through oral recitation and discussion. The term 'reader-listener' acknowledges both those who read the text themselves and those who listen to it being read aloud, as well as those who do both simultaneously."
            },
            {
              id: "fn2",
              number: 2,
              sectionId: "note-to-reader",
              content: "The distinction between 'narrator' and 'Educator' is significant. An Educator seeks to establish a Teacher-Student relationship based on what this work terms 'Functional Certitude'—a level of trust that enables genuine learning and transformation, not merely the transfer of information."
            }
          ]
        },
        {
          id: "preliminaries",
          title: "Preliminaries for Each Reader-Listener",
          pageReference: 8,
          content: `In what follows, we speak about Functional Certitude as the basis of sound Teacher-Student relationships. Personally, I earnestly desire such a sound Teacher-Student Relationship with every reader-listener, and I will strive throughout the book to prove myself worthy of their trust.

The Bible says: "Prove all things. Hold fast to what is good" (1 Thessalonians, 5:21).<sup data-footnote="3">3</sup> In a similar vein, the Anglican Book of Common Prayer urges the Believer: "Read, mark, learn, and inwardly digest." This beautiful admonition means "read and listen carefully." "Mark" or "take notes." Learn through study and devotion, and, finally, ponder carefully and repeatedly what you have gleaned by "digesting it inwardly" in order to gain lasting wisdom.

Robert Browning said: "Man partly is and wholly hopes to be." May The First Teaching enable each reader-listener to attain their greatest hopes and fullest growth so that—again, to quote Browning: "The best is yet to be,/The last of life, for which the first was made."`,
          footnotes: [
            {
              id: "fn3",
              number: 3,
              sectionId: "preliminaries",
              content: "This Biblical injunction aligns closely with the Islamic principle of verification (tabayyun) mentioned in the Qur'an: 'O you who believe! If a transgressor comes to you with news, verify it' (49:6). Both traditions emphasize the importance of critical examination and discernment in accepting knowledge and claims to truth."
            }
          ]
        },
        {
          id: "author-bio",
          title: "A Few Words about Myself",
          pageReference: 15,
          content: `In Islam, different ethnic roots, Cultural backgrounds, languages, and nationalities are set forth as Divine Signs, through which people are meant to gain wisdom and a deeper appreciation of one another. The Qur'an states:

"O Mankind! Truly, We created you from a [single] male and a [single] female, and We made you peoples and tribes, so that you may come to know one another: Surely, the most noble of you before God are the most reverent among you: Truly, God is All-Knowing [and] Cognizant [of every thing]" (The Private Rooms, 49:13).<sup data-footnote="4">4</sup>

In light of the importance of personal and ethnic background, I will now provide some insight into my family, since they played a meaningful role in my life and personal formation. My father's Weinman side (Swiss German: Wymann) were of Lutheran stock, hailing from Canton Bern in Switzerland. My mother's Landgraf side were Hessian Germans and devoted Roman Catholics from Upper Saulheim in Germany's Southern Rhineland region.`,
          footnotes: [
            {
              id: "fn4",
              number: 4,
              sectionId: "author-bio",
              content: "This verse establishes the Islamic framework for understanding human diversity. Rather than being a source of division or hierarchy, diversity in ethnicity, language, and culture is presented as a Divine pedagogical tool—a means by which humanity comes to mutual knowledge and appreciation. The verse concludes by establishing taqwa (reverence/God-consciousness) as the sole criterion of nobility before God, thereby eliminating any basis for racial, ethnic, or tribal superiority."
            }
          ]
        }
      ]
    },
    {
      id: "book-profile",
      number: 1,
      title: "Book Profile & Scope",
      description: "Understanding the Divine Science and the six Pillars of Islamic belief",
      sections: [
        {
          id: "scope",
          title: "The Divine Science and Its Foundations",
          pageReference: 68,
          content: `Speaking the Truth with Love is the introductory volume of First Teaching of the Last Message: The Divine Science and Its Six Pillars. The work is meant to be a reliable, wide-ranging, and in-depth reference for the six foundational Pillars (Arkān) of Islam's universal and timeless Prophetic Message.<sup data-footnote="5">5</sup>

The six Buttresses of Prophetic credence as established by Islam's two-part testimony of faith are belief in:

1. God
2. The Angels
3. The Revealed Books
4. The Prophet-Messengers
5. The Resurrection, Last Judgment, & Hereafter
6. Providence & the Foreordination of all things, including Good and Evil.

The field of study that articulates these foundations, their full implications, and other corollaries of Islam's two-part Prophetic declaration of faith is called both the Divine Science (al-'Ilm al-Ilāhī) and the Highest Science (al-'Ilm al-A'lā).`,
          footnotes: [
            {
              id: "fn5",
              number: 5,
              sectionId: "scope",
              content: "These six Pillars are distinct from the Five Pillars of Islam (the testimony of faith, prayer, fasting, charity, and pilgrimage), which pertain to practice. The six Pillars discussed in this work are the foundational beliefs (Arkān al-Īmān) that every Muslim must affirm. They are explicitly mentioned in the famous Hadith of Gabriel, where the Angel Gabriel came to the Prophet in human form and asked him to define Islam, Iman (faith), and Ihsan (excellence)."
            }
          ]
        },
        {
          id: "metaphysics",
          title: "Metaphysics and the Science of What Is",
          pageReference: 72,
          content: `This thorough-going study in Islam of Divinity, Prophecy, the Seen, and the Unseen constitutes a universal Metaphysical and historical discipline, which may be defined as: "The Science of what is as it [truly] is, according to the rubric of Islam (Al-'Ilm bi-al-mawjūd bi-mā huwa mawjūd 'alā qanūn al-Islām)."<sup data-footnote="6">6</sup>

This explication of the Divine Science is virtually identical to the Science of Metaphysics as defined by Aristotle and Ibn Sīnā (Latin: Avicenna), but with the all-important difference of establishing Islamic Revelation as the basic standard and ultimate criterion for all sound Metaphysical and speculative discourse about God and ultimate realities.

Homō Religiōsus—"Man the Believer"—requires sound and meaningful answers to all his existentialist and religious queries and questionings, especially the chief issues that perplex him and preoccupy his consciousness from time to time.`,
          footnotes: [
            {
              id: "fn6",
              number: 6,
              sectionId: "metaphysics",
              content: "Aristotle defined metaphysics as 'the science of being qua being'—the study of what exists insofar as it exists. Ibn Sīnā refined this to 'the science of things as they are' (al-'ilm bi-al-ashyā' bi-mā hiya). The Islamic formulation adds the crucial qualifier 'according to the rubric of Islam,' establishing Revelation as the criterion. This does not negate reason but situates it within its proper domain, recognizing that ultimate realities transcend unaided human intellection."
            }
          ]
        }
      ]
    },
    {
      id: "speaking-truth",
      number: 2,
      title: "Speaking the Truth with Love",
      description: "The methodology and ethos of this Teaching",
      sections: [
        {
          id: "examined-life",
          title: "The Unexamined Life",
          pageReference: 95,
          content: `Socrates said, "The unexamined life is not worth living." It is the purpose of The First Teaching to empower each reader, listener, and reader-listener to examine their lives realistically and fill them with meaning: Why are we what we are? What is our purpose in this life? Why is anything what it is? Why are things the way they are? Why is there Evil? And why is there Good?<sup data-footnote="7">7</sup>

In the process of answering such fundamental existential questions, The First Teaching seeks to disclose the roots of true "Identity" for a generation that loves to invoke that term but is often confused about what it means and who and what they are as well as what they and the world are meant to be.

As accountable Human Beings, it is our obligation to make ourselves and the world around us intelligible. We must be able to explain who we are, why life is as it is, and what the world is meant to be.`,
          footnotes: [
            {
              id: "fn7",
              number: 7,
              sectionId: "examined-life",
              content: "These fundamental questions have occupied philosophers and theologians throughout human history. In the Islamic tradition, they find their answer in the Qur'anic verse: 'I created jinn and mankind only to worship Me' (51:56). This verse establishes the telos (ultimate purpose) of human existence, but understanding what 'worship' ('ibāda) truly means requires the comprehensive study that this work undertakes."
            }
          ]
        },
        {
          id: "truth-with-love",
          title: "Speaking Truth with Love",
          pageReference: 98,
          content: `In the quest for trustworthy knowledge, The First Teaching is dedicated to speaking the truth plainly and unapologetically, while setting forth the distinction between what is real and meaningful and what is not. But, in this pursuit for clarity and meaning, the book seeks to abide by the New Testament wisdom: "Speak the truth with love" (álētheúein én ágápē; άληθεύειν έν άγάπη) (Ephesians, 4:15).<sup data-footnote="8">8</sup>

New Testament wisdom counsels: "Let your speech be always with grace, seasoned with salt, so that you may know how you ought to answer every man" (Colossians, 4:6). It also advises: "Let all things be done in a fitting way and good order" (1 Corinthians, 14:40).

Honest discourse is essential to Civilization and our shared Humanity, and we must always strive to build bridges and speak with each other empathetically, rationally, and in a spirit of forgiveness—Muslim, Jew, Christian, and others—as if we were one family.`,
          footnotes: [
            {
              id: "fn8",
              number: 8,
              sectionId: "truth-with-love",
              content: "The Greek phrase 'alētheuein en agapē' combines two essential virtues: alētheia (truth, reality, what is unhidden) and agapē (selfless love, charity). This principle finds its Islamic parallel in the combination of haqq (truth, reality, right) and raḥma (mercy, compassion). The Prophet Muhammad embodied both, being described in the Qur'an as 'a mercy to all the worlds' (21:107) while also being commanded to 'Say: The truth has come' (17:81). The synthesis of truth-telling and compassionate delivery is a hallmark of prophetic communication."
            }
          ]
        }
      ]
    }
  ]
};
