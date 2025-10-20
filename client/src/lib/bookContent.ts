import type { BookData } from "@shared/schema";

// Complete book content with formatting preserved
// HTML tags used: <b> for bold, <i> for italic, <u> for underline, <sup> for superscript
export const completeBookData: BookData = {
  volumeNumber: 1,
  volumeTitle: "Speaking the Truth with Love",
  seriesTitle: "First Teaching of the Last Message",
  seriesSubtitle: "The Divine Science and Its Six Pillars",
  author: "Umar F. Abd-Allah Wymann-Landgraf",
  introduction: "This digital companion provides extended discussions and detailed commentary referenced in the physical Volume 1. The First Teaching explores the foundational Pillars of Islamic belief and their vast implications for understanding reality, cognition, and the Human condition.",
  totalVolumes: 18,
  chapters: [
    {
      id: "foreword",
      number: 0,
      title: "Foreword",
      description: "Introduction to the work and its relationship with reader-listeners",
      sections: [
        {
          id: "note-to-reader",
          title: "A Note to the Reader",
          pageReference: 3,
          content: `To begin with, this book like many Traditional Islamic texts is written to be <b>read out loud</b> in the presence of readers, listeners, and reader-listeners with the assistance of authorized teachers. Therefore, instead of just speaking of the reader, I often like to use the term <b>"reader-listener"</b> to refer to the people studying this work or, occasionally, the cumbersome expression "reader, listener, and reader-listener." Since it is monotonous to cite all three of these roles every time I want to address those engaging with the book, I often use the more concise term "reader-listener" to refer to all of them together, unless there is a good reason to specify one or the other individually.<sup data-footnote="1">1</sup>

Because this Teaching seeks this special relationship with its readers, listeners, and reader-listeners—whatever their background or the level of their formal education—it is helpful for them to have an idea of how this Teaching is meant to relate to them personally and what it expects of them. As frequently noted, <i>The First Teaching</i> is meant to be <b>read out loud</b> to reader-listeners who attend to it as closely as possible and who will hopefully be able to ask questions and receive answers.`,
          footnotes: [
            {
              id: "fn1",
              number: 1,
              sectionId: "note-to-reader",
              content: "This pedagogical approach reflects the Traditional Islamic method of transmission, where knowledge is not merely read silently but engaged with actively through oral recitation and discussion. The term 'reader-listener' acknowledges both those who read the text themselves and those who listen to it being read aloud, as well as those who do both simultaneously—which is the ideal mode of engagement with this work."
            }
          ]
        },
        {
          id: "preliminaries",
          title: "Preliminaries for Each Reader-Listener",
          pageReference: 8,
          content: `In what follows, we speak about <b>Functional Certitude</b> as the basis of sound Teacher-Student relationships. Personally, I earnestly desire such a sound Teacher-Student Relationship with every reader-listener, and I will strive throughout the book to prove myself worthy of their trust. <i>The First Teaching</i> is a "Teaching." It is not a narrative or just a book. In this work, I present myself—not as an ordinary academic narrator—but as an <b>Educator</b>.<sup data-footnote="2">2</sup> This approach is central to how this work should be understood and engaged with.

Beginnings are all-important, a Principle that I will repeatedly explain and advocate for throughout this book. Even when we have been blessed with good beginnings, we should strive to make new and better ones each day. In this sense, I hope that <i>The First Teaching</i> will be like a "first new and promising day" for each reader-listener, no matter what has gone before—however good or bad—but with confidence that all the best is yet to come.

It is natural for us to take our lives seriously, and that is also one of the primary signs of sound mental health. At the same time, we must take existence itself in the greatest of earnest, which means that we must learn how to contemplate existence and the world around us properly—not just as an act of cognition but as an act of supreme Virtue and Morality.

The Bible says: <b>"Prove all things. Hold fast to what is good"</b> (1 Thessalonians, 5:21).<sup data-footnote="3">3</sup> In a similar vein, the Anglican Book of Common Prayer urges the Believer: <b>"Read, mark, learn, and inwardly digest."</b> This beautiful admonition means "read and listen carefully." "Mark" or "take notes." Learn through study and devotion, and, finally, ponder carefully and repeatedly what you have gleaned by "digesting it inwardly" in order to gain lasting wisdom.

Robert Browning said: "Man partly is and wholly hopes to be." May <i>The First Teaching</i> enable each reader-listener to attain their greatest hopes and fullest growth so that—again, to quote Browning: <b>"The best is yet to be,/The last of life, for which the first was made."</b>`,
          footnotes: [
            {
              id: "fn2",
              number: 2,
              sectionId: "preliminaries",
              content: "The distinction between 'narrator' and 'Educator' is significant. An Educator seeks to establish a Teacher-Student relationship based on what this work terms 'Functional Certitude'—a level of trust that enables genuine learning and transformation, not merely the transfer of information. This relationship is foundational to the Traditional Islamic transmission of knowledge."
            },
            {
              id: "fn3",
              number: 3,
              sectionId: "preliminaries",
              content: "This Biblical injunction aligns closely with the Islamic principle of verification (<i>tabayyun</i>) mentioned in the Qur'an: 'O you who believe! If a transgressor comes to you with news, verify it' (49:6). Both traditions emphasize the importance of critical examination and discernment in accepting knowledge and claims to truth."
            }
          ]
        }
      ]
    },
    {
      id: "author-background",
      number: 0,
      title: "A Few Words about Myself",
      description: "The author's family roots, personal background, and spiritual journey",
      sections: [
        {
          id: "family-roots",
          title: "Family Roots & Personal Background",
          pageReference: 15,
          content: `In Islam, different ethnic roots, Cultural backgrounds, languages, and nationalities are set forth as Divine Signs, through which people are meant to gain wisdom and a deeper appreciation of one another. By virtue of these variations, we come to know the reality of the Human condition, hopefully learning how Human Beings complement each other to the mutual benefit of all. Thus, our outward diversity is meant not to divide us or pit us against each other but to unite us, enabling us to discover through that diversity the reality of our shared Humanity and oneness as a single Family. The Qur'an states:

<b>"O Mankind! Truly, We created you from a [single] male and a [single] female, and We made you peoples and tribes, so that you may come to know one another: Surely, the most noble of you before God are the most reverent among you: Truly, God is All-Knowing [and] Cognizant [of every thing]"</b> (The Private Rooms, 49:13).<sup data-footnote="4">4</sup>

In light of the importance of personal and ethnic background, I will now provide some insight into my family, since they played a meaningful role in my life and personal formation. I hope that this parenthesis will neither be excessive nor cumbersome. I do, however, owe an immense debt to my family, which I feel it is my duty to acknowledge in any honest account of myself.

My father's Weinman side (Swiss German: Wymann) were of Lutheran stock, hailing from Canton Bern in Switzerland. My mother's Landgraf side immigrated to the United States toward the middle of the thirteenth/nineteenth century. They were Hessian Germans and devoted Roman Catholics from Upper Saulheim in Germany's Southern Rhineland region.`,
          footnotes: [
            {
              id: "fn4",
              number: 4,
              sectionId: "family-roots",
              content: "This verse (49:13) establishes the Islamic framework for understanding human diversity. Rather than being a source of division or hierarchy, diversity in ethnicity, language, and culture is presented as a Divine pedagogical tool—a means by which humanity comes to mutual knowledge and appreciation. The verse concludes by establishing <i>taqwā</i> (reverence/God-consciousness) as the sole criterion of nobility before God, thereby eliminating any basis for racial, ethnic, or tribal superiority."
            }
          ]
        },
        {
          id: "conversion",
          title: "My Journey to the Declaration of God's Oneness & Islam",
          pageReference: 28,
          content: `I was born on <b>2 Jumādā al-Ākhira 1367/April 11, 1948</b>, in Columbus, Nebraska and christened <b>Larry Gene Weinman</b>. My family were Protestants, and Christianity made up a standard component of my family life, although we remained somewhat distant from local congregations and rarely became much involved in Church work.

At the age of twelve after completing Catechism, I was granted official confirmation in the Lutheran Church. But almost immediately after my confirmation, my father, by merely asking a simple question, made me conscious of the fact that the Trinity was open to question. His apparent reservations about the Trinity affected me deeply, leading me to question my Pastor about the validity of the Doctrine only a few days later.<sup data-footnote="5">5</sup>

I embraced Islam as a graduate student at Cornell University on <b>25 Shawwāl 1389/3 January 1970</b>, after reading <i>The Autobiography of Malcolm X</i>, which was required reading in an English Department course on African-American Literature in which I had enrolled. Conversion to Islam brought to culmination my personal search for the One God, while also giving rise to powerful new directions in my life, especially by ultimately changing my field of graduate study to Arabic and the Islamic Tradition.`,
          footnotes: [
            {
              id: "fn5",
              number: 5,
              sectionId: "conversion",
              content: "The author's questioning of the Trinity at age twelve represents a pivotal moment in his spiritual development. Since neither his Pastor nor anyone else could remove these doubts, he continued to question the Doctrine throughout his teenage years, ultimately leading to his embrace of Islamic monotheism (<i>tawḥīd</i>)—the uncompromising affirmation of God's absolute Oneness."
            }
          ]
        },
        {
          id: "spiritual-path",
          title: "Spiritual Pathways: Traversing New Heights",
          pageReference: 35,
          content: `In the eighteen years between my relocation to Spain in 1402/1982 until my return to the United States in 1421/2000, I was given multiple opportunities to keep the company of authentic representatives of Traditional Islamic teaching and Spirituality, many of them Scholars and Spiritual Guides—both men and women—hailing from across the Muslim world. At the time of this book's writing, my living connection with such Traditional Teachers and Guides has lasted for more than forty-three years.

In 1425/2004, four years after returning to the United States, I officially adopted <b>the Qādirī Path</b> of al-Shaykh 'Abd-al-Qādir al-Jīlānī, although I had, in fact, already been directly associated with that Path and others since 1405/1985. Today, I maintain my link with the Qādirī Path, striving in accordance with its guidelines of service and love to be of benefit to all of God's creation. For, as al-Shaykh 'Abd-al-Qādir taught: <b>"Sufism is Truthfulness with [God], the Real, and good character toward His creation"</b> (<i>al-Taṣawwuf huwa al-ṣidq ma'a al-Ḥaqq wa ḥusn al-khuluq ma'a al-khalq</i>).`,
          footnotes: []
        }
      ]
    }
  ]
};
